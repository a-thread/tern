import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { LocalDb } from '@shared/backend/localDb';
import { LocalMetaKey, setLocalMeta } from '@shared/backend/localMeta';
import { ToastProvider } from '@shared/state/ToastContext';
import { type Backend, useBackend } from './BackendContext';
import type { SubscriptionRepository } from './domain/subscription/subscription.repository';
import AuthGate from './AuthGate';
import { useHealthConsent } from './domain/consent/HealthConsentContext';
import {
  type ConsentRepository,
  createMemoryConsentRepository,
} from './domain/consent/consent.repository';
import { HealthConsent } from './domain/consent/models/healthConsent';

// Every test here renders the whole app on sql.js; the first also pays for loading it, which can
// pass Jest's 5s default on a cold CI runner.
jest.setTimeout(15000);

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

const { createLocalBackend }: typeof import('./BackendContext') =
  jest.requireActual('./BackendContext');
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
  const consent = useHealthConsent();
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
      {consent ? (
        <Pressable onPress={consent.withdraw} accessibilityRole='button'>
          <Text>Withdraw</Text>
        </Pressable>
      ) : null}
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
const accountRestDays = () =>
  mockAccount.restDays.load('2026-01-01', '2026-12-31');

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
    render(app());
    await screen.findByText('0 rest days');
    expect(screen.queryByText('Forgot password?')).toBeNull();

    mockAuth.signingIn = true;
    await act(async () => screen.rerender(app()));
    expect(await screen.findByText('Forgot password?')).toBeTruthy();
  });

  it('presents the sign-in screens as a modal, so they show over the Settings sheet', async () => {
    mockAuth.closeSignIn.mockClear();
    render(app());
    await screen.findByText('0 rest days');

    mockAuth.signingIn = true;
    await act(async () => screen.rerender(app()));
    await screen.findByText('Forgot password?');
    // A view laid over the root opened behind Settings, a native sheet, and was never seen.
    const modal = screen.UNSAFE_getByType(Modal);
    expect(modal.props.visible).toBe(true);

    // Android's back button leaves them, as "Not now" does.
    fireEvent(modal, 'requestClose');
    expect(mockAuth.closeSignIn).toHaveBeenCalled();
  });

  it('keeps the app where it was under the sign-in screens, so closing them goes back there', async () => {
    const ui = render(app());
    await screen.findByText('0 rest days');

    mockAuth.signingIn = true;
    await act(async () => ui.rerender(app()));
    await screen.findByText('Forgot password?');
    mockAuth.signingIn = false;
    await act(async () => ui.rerender(app()));

    expect(screen.queryByText('Forgot password?')).toBeNull();
    expect(screen.getByText('0 rest days')).toBeTruthy();
    // Never unmounted, so nothing (Settings, a scroll position) had to be rebuilt.
    expect(mounts).toBe(1);
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
      await screen.findByText(
        'Moved 1 entry from this phone into your account.',
      ),
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

  it('saves to the phone when the server says the account has no Plus, since the account would refuse every save', async () => {
    mockPlus = createMemorySubscriptionRepository(PLUS);
    await mockAccount.restDays.add('2026-10-17');
    mockAccount = { ...mockAccount, syncPlus: async () => false };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(app());
    // The account's log comes along, so nothing already saved goes missing.
    expect(await screen.findByText('1 rest days')).toBeTruthy();
    expect(await screen.findByText(/Your account can't sync yet/)).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Rest')));
    expect(await phoneRestDays()).toEqual(['2026-10-17', '2026-10-18']);
    expect(await accountRestDays()).toEqual(['2026-10-17']);
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

  it('when the store cannot be reached and the server says no Plus, saves to the phone', async () => {
    mockPlus = createMemorySubscriptionRepository(NO_PLUS);
    mockPlus.identify = async () => {
      throw new Error('offline');
    };
    await mockAccount.restDays.add('2026-10-17');
    mockAccount = { ...mockAccount, syncPlus: async () => false };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(app());
    expect(await screen.findByText('1 rest days')).toBeTruthy();
    expect(await screen.findByText(/Your account can't sync yet/)).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Rest')));
    expect(await phoneRestDays()).toEqual(['2026-10-17', '2026-10-18']);
    expect(await accountRestDays()).toEqual(['2026-10-17']);
    warn.mockRestore();
  });
});

describe('AuthGate health data consent', () => {
  let consent: ConsentRepository;
  const CONSENT_TITLE = 'Keep your log in your account?';

  beforeEach(async () => {
    mockAuth.session = { user: { id: 'me', email: 'me@example.com' } };
    mockPlus = createMemorySubscriptionRepository(PLUS);
    consent = createMemoryConsentRepository();
    mockAccount = { ...mockAccount, consent };
  });

  it('asks before anything syncs, and moves nothing until agreed', async () => {
    await createLocalBackend(mockPhoneDb).restDays.add('2026-10-17');
    const syncPlus = jest.fn(async () => true);
    mockAccount = { ...mockAccount, syncPlus };
    render(app());
    expect(await screen.findByText(CONSENT_TITLE)).toBeTruthy();
    expect(syncPlus).not.toHaveBeenCalled();
    expect(await phoneRestDays()).toEqual(['2026-10-17']);
    expect(await accountRestDays()).toEqual([]);
  });

  it('records the current policy version on agreeing, then moves the log in', async () => {
    await createLocalBackend(mockPhoneDb).restDays.add('2026-10-17');
    render(app());
    await screen.findByText(CONSENT_TITLE);
    await act(async () => fireEvent.press(screen.getByText('I agree')));
    expect(await screen.findByText('1 rest days')).toBeTruthy();
    expect((await consent.get())?.policyVersion).toBe(
      HealthConsent.POLICY_VERSION,
    );
    expect(await accountRestDays()).toEqual(['2026-10-17']);
    expect(await phoneRestDays()).toEqual([]);
  });

  it('asks again when the policy has moved on since consent was given', async () => {
    await consent.give('2020-01');
    render(app());
    expect(await screen.findByText(CONSENT_TITLE)).toBeTruthy();
  });

  it('goes straight to the account once consent to this policy is given', async () => {
    await consent.give(HealthConsent.POLICY_VERSION);
    await mockAccount.restDays.add('2026-10-18');
    render(app());
    expect(await screen.findByText('1 rest days')).toBeTruthy();
    expect(screen.queryByText(CONSENT_TITLE)).toBeNull();
  });

  it('"Not now" keeps everything on the phone, with the account\'s log copied down', async () => {
    await mockAccount.restDays.add('2026-10-17');
    render(app());
    await screen.findByText(CONSENT_TITLE);
    await act(async () => fireEvent.press(screen.getByText('Not now')));
    expect(await screen.findByText('1 rest days')).toBeTruthy();
    expect(await screen.findByText(/Sync is off/)).toBeTruthy();
    await act(async () => fireEvent.press(screen.getByText('Rest')));
    expect(await phoneRestDays()).toEqual(['2026-10-17', '2026-10-18']);
    expect(await accountRestDays()).toEqual(['2026-10-17']);
    expect(await consent.get()).toBeNull();
  });

  it('says sync is off on a later "Not now" too, when nothing new is copied', async () => {
    // The account's log came down on an earlier "Not now".
    await setLocalMeta(mockPhoneDb, LocalMetaKey.COPIED_FROM_ACCOUNT, 'me');
    render(app());
    await screen.findByText(CONSENT_TITLE);
    await act(async () => fireEvent.press(screen.getByText('Not now')));
    expect(await screen.findByText(/Sync is off/)).toBeTruthy();
  });

  it('says sync is off, not that Plus ended, when the copy down fails', async () => {
    mockAccount = {
      ...mockAccount,
      data: {
        ...mockAccount.data!,
        exportAll: async () => {
          throw new Error('offline');
        },
      },
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(app());
    await screen.findByText(CONSENT_TITLE);
    await act(async () => fireEvent.press(screen.getByText('Not now')));
    expect(
      await screen.findByText(/Sync is off, so Tern is saving to this phone/),
    ).toBeTruthy();
    expect(screen.queryByText(/Tern Plus has ended/)).toBeNull();
    warn.mockRestore();
  });

  it('offline, goes by the consent this phone last saw instead of asking again', async () => {
    await consent.give(HealthConsent.POLICY_VERSION);
    const online = render(app());
    await screen.findByText('0 rest days');
    online.unmount();

    mockAccount = {
      ...mockAccount,
      consent: {
        ...consent,
        get: async () => {
          throw new Error('offline');
        },
      },
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(app());
    expect(await screen.findByText('0 rest days')).toBeTruthy();
    expect(screen.queryByText(CONSENT_TITLE)).toBeNull();
    warn.mockRestore();
  });

  it('offline, asks when this phone has no consent on record for the account', async () => {
    // Another account's consent doesn't count.
    await setLocalMeta(
      mockPhoneDb,
      LocalMetaKey.HEALTH_CONSENT,
      JSON.stringify({
        userId: 'other',
        policyVersion: HealthConsent.POLICY_VERSION,
        consentedAt: '2026-11-22T10:00:00Z',
      }),
    );
    mockAccount = {
      ...mockAccount,
      consent: {
        ...consent,
        get: async () => {
          throw new Error('offline');
        },
      },
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(app());
    expect(await screen.findByText(CONSENT_TITLE)).toBeTruthy();
    warn.mockRestore();
  });

  it("withdrawing on a shared phone clears another account's copy instead of mixing logs", async () => {
    await consent.give(HealthConsent.POLICY_VERSION);
    // The phone still holds another account's copy from when its Plus ended.
    await createLocalBackend(mockPhoneDb).restDays.add('2026-10-01');
    await setLocalMeta(mockPhoneDb, LocalMetaKey.COPIED_FROM_ACCOUNT, 'other');
    await mockAccount.restDays.add('2026-10-18');
    render(app());
    await screen.findByText('1 rest days');
    await act(async () => fireEvent.press(screen.getByText('Withdraw')));
    expect(await screen.findByText(/Consent withdrawn/)).toBeTruthy();
    expect(await phoneRestDays()).toEqual(['2026-10-18']);
  });

  it('withdrawing copies the log to the phone, then erases the account and stops syncing', async () => {
    await consent.give(HealthConsent.POLICY_VERSION);
    await mockAccount.restDays.add('2026-10-18');
    render(app());
    await screen.findByText('1 rest days');
    await act(async () => fireEvent.press(screen.getByText('Withdraw')));
    expect(await screen.findByText(/Consent withdrawn/)).toBeTruthy();
    expect(await phoneRestDays()).toEqual(['2026-10-18']);
    expect(await accountRestDays()).toEqual([]);
    expect(await consent.get()).toBeNull();
    expect(await screen.findByText('1 rest days')).toBeTruthy();
    expect(screen.queryByText('Withdraw')).toBeNull();
  });
});
