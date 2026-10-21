import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { useBackend } from './BackendContext';
import AuthGate from './AuthGate';

// Supabase configured, but nobody signed in: the free tier.
jest.mock('@shared/backend/supabase', () => ({
  isBackendConfigured: true,
  supabase: null,
}));

// The phone's database, played by sql.js.
jest.mock('@shared/backend/localDb.expo', () => ({
  openLocalDb: () =>
    jest.requireActual('@shared/backend/localDb.sqljs').createMigratedSqlJsDb(),
}));

jest.mock('./domain/activity/steps.health', () => ({
  createHealthStepsRepository: () => null,
}));
jest.mock('./domain/movement/movement.health', () => ({
  createHealthWorkouts: () => null,
}));

const mockAuth = {
  loading: false,
  session: null,
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

beforeEach(() => {
  mounts = 0;
  mockAuth.signingIn = false;
});

describe('AuthGate without an account', () => {
  it('opens straight onto the phone database', async () => {
    render(app());
    expect(await screen.findByText('0 rest days')).toBeTruthy();
  });

  it('shows the sign-in screens only once they are asked for', async () => {
    mockAuth.signingIn = true;
    render(app());
    expect(await screen.findByText('Not now, keep using this phone')).toBeTruthy();
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
