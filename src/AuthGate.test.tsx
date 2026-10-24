import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { LocalDb } from '@shared/backend/localDb';
import { ToastProvider } from '@shared/state/ToastContext';
import { type Backend, useBackend } from './BackendContext';
import type { SubscriptionRepository } from './domain/subscription/subscription.repository';
import AuthGate from './AuthGate';

// Supabase configured: the real gate, with its sign-in states.
jest.mock('@shared/backend/supabase', () => ({
  isBackendConfigured: true,
  supabase: null,
}));

// The phone's database, played by sql.js: the same one for the whole of a test.
let mockPhoneDb: LocalDb;
jest.mock('@shared/backend/localDb.expo', () => ({
  openLocalDb: async () => mockPhoneDb,
}));

jest.mock('./domain/activity/steps.health', () => ({
  createHealthStepsRepository: () => null,
}));
jest.mock('./domain/movement/movement.health', () => ({
  createHealthWorkouts: () => null,
}));

// The account is played by a second database, and Tern Plus by a repository each test sets.
let mockAccount: Backend;
let mockPlus: SubscriptionRepository;
jest.mock('./BackendContext', () => ({
  ...jest.requireActual('./BackendContext'),
  createRemoteBackend: () => mockAccount,
  createSubscriptionRepository: () => mockPlus,
}));

const mockAuth = {
  loading: false,
  session: null as { user: { id: string; email: string } } | null,
  signingIn: false,
  passwordRecoveryPending: false,
  startOnSignUp: false,
  openSignIn: jest.fn(),
  closeSignIn: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  sendPasswordReset: jest.fn(),
  updatePassword: jest.fn(),
  signOut: jest.fn(),
};
jest.mock('./domain/auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuth,
}));

const {
  createLocalBackend,
}: typeof import('./BackendContext') = jest.requireActual('./BackendContext');
const { createMigratedSqlJsDb } = jest.requireActual(
  '@shared/backend/localDb.sqljs',
);
const { createMemorySubscriptionRepository } = jest.requireActual(
  './domain/subscription/subscription.repository',
);

const PLUS = { active: true, renews: true, expiresAt: null };
const NO_PLUS = { active: false, renews: false, expiresAt: null };

let mounts = 0;

/** Stands in for the app: shows how many rest days the backend holds, and can erase them. */
function Probe() {
  const backend = useBackend();
  const [restDays, setRestDays] = useState<number | null>(null);
  useEffect(() => {
    mounts++;
    backend.restDays
      .load('2026-01-01', '2026-12-31')
      .then((days) => setRestDays(days.length));
  }, [backend]);
  return (
    <>
      <Text>{restDays === null ? 'loading' : `${restDays} rest days`}</Text>
      <Pressable
        onPress={() => backend.restDays.add('2026-10-18')}
        accessibilityRole='button'
      >
        <Text>Rest</Text>
      </Pressable>
      <Pressable
        onPress={() => backend.data!.deleteAll()}
        accessibilityRole='button'
      >
        <Text>Erase</Text>
      </Pressable>
    </>
  );
}

const app = () => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <ToastProvider>
      <AuthGate>
        <Probe />
      </AuthGate>
    </ToastProvider>
  </SafeAreaProvider>
);

const phoneRestDays = () =>
  createLocalBackend(mockPhoneDb).restDays.load('2026-01-01', '2026-12-31');
const accountRestDays = () => mockAccount.restDays.load('2026-01-01', '2026-12-31');

beforeEach(async () => {
  mounts = 0;
  mockAuth.signingIn = false;
  mockAuth.session = null;
  mockPhoneDb = await createMigratedSqlJsDb();
  mockAccount = createLocalBackend(await createMigratedSqlJsDb());
  mockPlus = createMemorySubscriptionRepository();
});

describe('AuthGate without an account', () => {
  it('opens straight onto the phone database', async () => {
    render(app());
    expect(await screen.findByText('0 rest days')).toBeTruthy();
  });

  it('shows the sign-in screens only once they are asked for', async () => {
    mockAuth.signingIn = true;
    render(app());
    expect(await screen.findByLabelText('Settings')).toBeTruthy();
    expect(screen.queryByText('0 rest days')).toBeNull();
  });

  it('reloads the app from the emptied database after "Delete my data"', async () => {
    render(app());
    await screen.findByText('0 rest days');
    await act(async () => fireEvent.press(screen.getByText('Rest')));
    await act(async () => fireEvent.press(screen.getByText('Erase')));
    expect(await screen.findByText('0 rest days')).toBeTruthy();
    expect(mounts).toBe(2);
  });
});

describe('AuthGate signed in', () => {
  beforeEach(() => {
    mockAuth.session = { user: { id: 'me', email: 'me@example.com' } };
  });

  it("with Plus, moves the phone's log into the account and shows the account", async () => {
    mockPlus = createMemorySubscriptionRepository(PLUS);
    await createLocalBackend(mockPhoneDb).restDays.add('2026-10-17');
    await mockAccount.restDays.add('2026-10-18');
    render(app());
    expect(await screen.findByText('2 rest days')).toBeTruthy();
    expect(await phoneRestDays()).toEqual([]);
    expect(
      await screen.findByText('Moved 1 entry from this phone into your account.'),
    ).toBeTruthy();
  });

  it('brings the server up to date with Plus before moving anything in', async () => {
    mockPlus = createMemorySubscriptionRepository(PLUS);
    await createLocalBackend(mockPhoneDb).restDays.add('2026-10-17');
    const order: string[] = [];
    const importAll = mockAccount.data!.importAll!;
    mockAccount = {
      ...mockAccount,
      syncPlus: async () => {
        order.push('sync');
        return true;
      },
      data: {
        ...mockAccount.data!,
        importAll: async (copy) => {
          order.push('move');
          return importAll(copy);
        },
      },
    };
    render(app());
    await screen.findByText('1 rest days');
    expect(order).toEqual(['sync', 'move']);
  });

  it('still opens the account when the server could not be brought up to date', async () => {
    mockPlus = createMemorySubscriptionRepository(PLUS);
    mockAccount = {
      ...mockAccount,
      syncPlus: async () => {
        throw new Error('offline');
      },
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(app());
    expect(await screen.findByText('0 rest days')).toBeTruthy();
    warn.mockRestore();
  });

  it("once Plus has ended, copies the account's log onto the phone and carries on there", async () => {
    mockPlus = createMemorySubscriptionRepository(NO_PLUS);
    await mockAccount.restDays.add('2026-10-18');
    render(app());
    expect(await screen.findByText('1 rest days')).toBeTruthy();
    expect(await phoneRestDays()).toEqual(['2026-10-18']);
    // The phone's copy stands on its own: the account changing doesn't touch it.
    await mockAccount.restDays.remove('2026-10-18');
    expect(await phoneRestDays()).toEqual(['2026-10-18']);
    expect(await accountRestDays()).toEqual([]);
  });

  it('once Plus has ended, the renew paywall shows when asked for', async () => {
    mockPlus = createMemorySubscriptionRepository(NO_PLUS);
    mockAuth.signingIn = true;
    render(app());
    expect(await screen.findByText('Tern Plus')).toBeTruthy();
  });

  it('when the store cannot be reached, shows the account and moves nothing', async () => {
    mockPlus = createMemorySubscriptionRepository(NO_PLUS);
    mockPlus.identify = async () => {
      throw new Error('offline');
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await createLocalBackend(mockPhoneDb).restDays.add('2026-10-17');
    await mockAccount.restDays.add('2026-10-18');
    render(app());
    expect(await screen.findByText('1 rest days')).toBeTruthy();
    expect(await phoneRestDays()).toEqual(['2026-10-17']);
    warn.mockRestore();
  });
});
