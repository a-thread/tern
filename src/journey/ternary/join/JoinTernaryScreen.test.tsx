import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@shared/state/ToastContext';
import { createMemoryBackend } from '@/BackendContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { TernaryProvider } from '@/domain/ternary/TernaryContext';
import { takeRememberedJoin } from '@/navigation/pendingJoin';
import JoinTernaryScreen from './JoinTernaryScreen';

const mockAuth = { session: null as object | null, openSignIn: jest.fn() };
jest.mock('@/domain/auth/AuthContext', () => ({ useAuth: () => mockAuth }));
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const route = {
  key: 'j',
  name: 'JoinTernary' as const,
  params: { code: 'KTW4QP' },
};

// No ternary repository: no account with Tern Plus on this phone.
function open() {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            <TernaryProvider>
              <JoinTernaryScreen route={route} />
            </TernaryProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

describe('joining without Tern Plus', () => {
  beforeEach(async () => {
    mockAuth.openSignIn.mockClear();
    mockGoBack.mockClear();
    await takeRememberedJoin();
  });

  it('says it needs Tern Plus, and signs up keeping the invite', async () => {
    mockAuth.session = null;
    open();
    expect(screen.getByText('Ternaries come with Tern Plus')).toBeTruthy();
    expect(screen.getByText('KTW4QP')).toBeTruthy();
    expect(screen.queryByText('Join')).toBeNull();
    fireEvent.press(screen.getByText('Get Tern Plus'));
    expect(mockAuth.openSignIn).toHaveBeenCalledWith({ toSignUp: true });
    expect(await takeRememberedJoin()).toBe('KTW4QP');
  });

  it('renews for an account whose Plus has ended', () => {
    mockAuth.session = { user: { id: 'u' } };
    open();
    fireEvent.press(screen.getByText('Renew Tern Plus'));
    expect(mockAuth.openSignIn).toHaveBeenCalledWith();
  });

  it('can be put off', async () => {
    mockAuth.session = null;
    open();
    fireEvent.press(screen.getByText('Not now'));
    expect(mockGoBack).toHaveBeenCalled();
    expect(await takeRememberedJoin()).toBeNull();
  });
});
