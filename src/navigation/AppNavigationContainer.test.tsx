import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { NavigationState } from '@react-navigation/native';

import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '../BackendContext';
import { AppProviders } from '../AppProviders';
import { ToastProvider } from '@shared/state/ToastContext';
import { initialSettings } from '../domain/settings/models/appSettings';
import { Onboarding } from '../domain/settings/models/onboarding';
import { AppNavigationContainer } from './AppNavigationContainer';
import RootNavigator from './RootNavigator';
import { rememberNavigation } from './navigationMemory';

jest.mock('../domain/settings/reminders', () => ({
  SyncResult: { Ok: 'ok', Denied: 'denied' },
  syncReminders: jest.fn(async () => 'ok'),
  syncStreakAlerts: jest.fn(async () => undefined),
}));
jest.mock('@shared/hooks/useReduceMotion', () => ({
  useReduceMotion: () => true,
}));
jest.mock('@shared/utils/measureInWindow', () => ({
  measureInWindow: async () => ({ x: 16, y: 120, width: 320, height: 40 }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Somewhere deep in the app, as remembered before a remount: Settings › Data. */
const inSettings = {
  key: 'root',
  index: 1,
  routeNames: ['Tabs', 'Settings'],
  routes: [
    { key: 'tabs', name: 'Tabs' },
    {
      key: 'settings',
      name: 'Settings',
      state: {
        index: 0,
        routes: [{ key: 'data', name: 'DataSettings' }],
      },
    },
  ],
  stale: false,
  type: 'stack',
} as unknown as NavigationState;

function openApp(backend: Backend) {
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <BackendProvider backend={backend}>
          <AppProviders>
            <AppNavigationContainer>
              <RootNavigator />
            </AppNavigationContainer>
          </AppProviders>
        </BackendProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
}

afterEach(() => rememberNavigation(undefined));

describe('AppNavigationContainer', () => {
  it('starts on the wizard when it is still to do, whatever was remembered (after "Delete my data")', async () => {
    rememberNavigation(inSettings);
    openApp(createMemoryBackend());
    expect(
      await screen.findByText('Progress answers to your pace'),
    ).toBeTruthy();
  });

  it('goes back to where the app was once the wizard is done', async () => {
    const backend = createMemoryBackend();
    await backend.settings.save({
      ...initialSettings,
      onboarding: Onboarding.DONE,
    });
    rememberNavigation(inSettings);
    openApp(backend);
    expect(await screen.findByText('Your data')).toBeTruthy();
    expect(screen.queryByText('Progress answers to your pace')).toBeNull();
  });
});
