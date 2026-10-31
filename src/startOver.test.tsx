import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { LocalDb } from '@shared/backend/localDb';
import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { StepsStatus } from './domain/activity/models/stepsStatus';
import type { StepsRepository } from './domain/activity/steps.repository';
import { AppProviders } from './AppProviders';
import { AppNavigationContainer } from './navigation/AppNavigationContainer';
import RootNavigator from './navigation/RootNavigator';

jest.mock('./domain/activity/steps.health', () => ({
  createHealthStepsRepository: () => null,
}));
jest.mock('./domain/movement/movement.health', () => ({
  createHealthWorkouts: () => null,
}));
jest.mock('./domain/settings/reminders', () => ({
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

const { BackendProvider, createLocalBackend } =
  jest.requireActual('./BackendContext');
const { createMigratedSqlJsDb } = jest.requireActual(
  '@shared/backend/localDb.sqljs',
);

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** A phone whose health app reports `today` steps for today and nothing before. */
const stepsToday = (today: number): StepsRepository => ({
  status: async () => StepsStatus.Connected,
  connect: async () => StepsStatus.Connected,
  getRange: async (from, to) => {
    const key = dayKey(new Date());
    return key >= from && key <= to ? { [key]: today } : {};
  },
});

async function openEmptyPhone(steps: StepsRepository) {
  const db: LocalDb = await createMigratedSqlJsDb();
  const local = createLocalBackend(db);
  // Settings arrive a little late, as they can over a network or a busy disk.
  const settings = {
    ...local.settings,
    load: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return local.settings.load();
    },
  };
  const backend = { ...local, settings, steps };
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

describe('an empty phone (a new install, or after "Delete my data")', () => {
  it('opens on the wizard', async () => {
    await openEmptyPhone(stepsToday(500));
    expect(
      await screen.findByText('Progress answers to your pace'),
    ).toBeTruthy();
  });

  it('opens on the wizard even when today’s steps already reach the goal', async () => {
    await openEmptyPhone(stepsToday(30000));
    expect(
      await screen.findByText('Progress answers to your pace'),
    ).toBeTruthy();
  });
});
