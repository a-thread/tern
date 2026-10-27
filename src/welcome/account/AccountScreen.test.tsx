import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { BackendProvider, createMemoryBackend } from '../../BackendContext';
import { AppProviders } from '../../AppProviders';
import { ToastProvider } from '@shared/state/ToastContext';
import RootNavigator from '../../navigation/RootNavigator';

jest.mock('../../domain/settings/reminders', () => ({
  SyncResult: { Ok: 'ok', Denied: 'denied' },
  syncReminders: jest.fn(async () => 'ok'),
  syncStreakAlerts: jest.fn(async () => undefined),
}));
jest.mock('@shared/hooks/useReduceMotion', () => ({
  useReduceMotion: () => true,
}));
// Accounts exist in this build, and nobody is signed in.
const mockAuth = { session: null, openSignIn: jest.fn() };
jest.mock('../../domain/auth/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function openWizard() {
  const backend = createMemoryBackend();
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <BackendProvider backend={backend}>
          <AppProviders>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AppProviders>
        </BackendProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
  await screen.findByText('Progress answers to your pace');
  return backend;
}

const press = async (text: string) => {
  await act(async () => fireEvent.press(screen.getByText(text)));
};

/** Through the wizard to the screen before reminders, choosing "Without calorie counts" to keep it short. */
async function toAccount() {
  await press('Get started');
  await press('Next');
  if (screen.queryByText('Steps come from your phone')) await press('Skip');
  await press('Without calorie counts');
  await press('Next');
}

beforeEach(() => mockAuth.openSignIn.mockClear());

describe('account invitation', () => {
  it('comes just before reminders, and "Keep on this phone" settles it', async () => {
    const backend = await openWizard();
    await toAccount();
    expect(await screen.findByText('Keep your data safe')).toBeTruthy();

    await press('Keep on this phone');
    expect(await screen.findByText('A nudge now and then?')).toBeTruthy();
    await waitFor(async () =>
      expect((await backend.settings.load())?.onboarding).toMatchObject({
        accountOffered: true,
      }),
    );
    expect(mockAuth.openSignIn).not.toHaveBeenCalled();
  });

  it('opens account creation (Tern Plus first) and stays put, so backing out returns here', async () => {
    await openWizard();
    await toAccount();
    await press('Create an account');
    expect(mockAuth.openSignIn).toHaveBeenCalledWith({ toSignUp: true });
    await press('I already have an account');
    expect(mockAuth.openSignIn).toHaveBeenLastCalledWith();

    expect(screen.getByText('Keep your data safe')).toBeTruthy();
    expect(screen.queryByText('A nudge now and then?')).toBeNull();
  });

  it('is never shown after "I already have an account" on the first screen', async () => {
    await openWizard();
    await press('I already have an account');
    expect(mockAuth.openSignIn).toHaveBeenCalledWith();

    await toAccount();
    expect(await screen.findByText('A nudge now and then?')).toBeTruthy();
    expect(screen.queryByText('Keep your data safe')).toBeNull();
  });
});
