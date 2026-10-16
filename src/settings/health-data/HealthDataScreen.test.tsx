import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createMemoryBackend, type Backend } from '../../BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { FoodProvider } from '../../domain/food/FoodContext';
import { WaypointsProvider } from '../../domain/waypoints/WaypointsContext';
import { ActivityProvider } from '../../domain/activity/ActivityContext';
import { MovementProvider } from '../../domain/movement/MovementContext';
import { StepsRepository } from '../../domain/activity/steps.repository';
import { StepsStatus } from '../../domain/activity/models/stepsStatus';
import { SettingsProvider } from '../../domain/settings/SettingsContext';
import type { WorkoutsSource } from '../../domain/movement/movement.healthconnect';
import HealthDataScreen from './HealthDataScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: jest.fn() }),
}));

const today = dayKey();
const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** A step source that starts as `initial`, becomes `afterConnect` once connect() is called. */
function source(initial: StepsStatus, afterConnect: StepsStatus = initial) {
  let status = initial;
  const repo: StepsRepository & { fail: boolean } = {
    fail: false,
    status: async () => status,
    connect: async () => {
      status = afterConnect;
      return status;
    },
    getRange: async () => {
      if (repo.fail) throw new Error('unreachable');
      return status === StepsStatus.Connected ? { [today]: 3000 } : {};
    },
  };
  return repo;
}

/** A workout source that is granted once connect(true) is called, if `grants`. */
function workoutSource(grants = true) {
  let granted = false;
  const src: WorkoutsSource & { asked: number } = {
    asked: 0,
    connect: async (ask = false) => {
      if (ask) {
        src.asked++;
        granted = grants;
      }
      return granted;
    },
    getRange: async () => [],
  };
  return src;
}

async function open(
  steps: StepsRepository,
  {
    workouts,
    trackMovement = false,
  }: { workouts?: WorkoutsSource; trackMovement?: boolean } = {},
) {
  const backend: Backend = {
    ...createMemoryBackend(),
    steps,
    settings: { load: async () => ({ trackMovement }), save: async () => {} },
  };
  const ui = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <SettingsProvider repo={backend.settings}>
          <WaypointsProvider repo={backend.waypoints}>
            <FoodProvider repo={backend.food}>
              <MovementProvider repo={backend.movement} workouts={workouts}>
                <ActivityProvider
                  steps={backend.steps}
                  restDays={backend.restDays}
                >
                  <HealthDataScreen />
                </ActivityProvider>
              </MovementProvider>
            </FoodProvider>
          </WaypointsProvider>
        </SettingsProvider>
      </ToastProvider>
    </SafeAreaProvider>,
  );
  await act(async () => {}); // let the first load settle
  return ui;
}

describe('Health data screen', () => {
  describe.each([
    ['android', 'Health Connect'],
    ['ios', 'Apple Health'],
  ] as const)('on %s', (os, name) => {
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', os);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('tapping the Off chip asks for access and says it worked', async () => {
      const { findByText, getByLabelText } = await open(
        source(StepsStatus.NeedsPermission, StepsStatus.Connected),
      );
      fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
      await findByText(`${name} is connected.`);
    });

    it(`says so when ${name} is not available on the device`, async () => {
      const { findByText, getByLabelText } = await open(
        source(StepsStatus.Unavailable),
      );
      fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
      await findByText(`${name} isn't available on this device.`);
    });
  });

  describe('connecting with movement tracked', () => {
    const connected = () =>
      source(StepsStatus.NeedsPermission, StepsStatus.Connected);
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', 'android');
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('also asks to read workouts', async () => {
      const workouts = workoutSource();
      const { findByText, getByLabelText } = await open(connected(), {
        workouts,
        trackMovement: true,
      });
      fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
      await findByText('Health Connect is connected.');
      expect(workouts.asked).toBe(1);
    });

    it('says so when workouts were refused', async () => {
      const { findByText, getByLabelText } = await open(connected(), {
        workouts: workoutSource(false),
        trackMovement: true,
      });
      fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
      await findByText(
        'Health Connect is connected. Allow Tern to read workouts in Health Connect to count them.',
      );
    });

    it('does not ask for workouts when movement is off', async () => {
      const workouts = workoutSource();
      const { findByText, getByLabelText } = await open(connected(), {
        workouts,
      });
      fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
      await findByText('Health Connect is connected.');
      expect(workouts.asked).toBe(0);
    });
  });

  it('says so when permission was not granted', async () => {
    const { findByText, getByLabelText } = await open(
      source(StepsStatus.NeedsPermission),
    );
    fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
    await findByText('Tern still needs permission to read your steps.');
  });

  it('has no Off button once connected, and Sync now confirms with a message', async () => {
    const { findByText, queryByLabelText, getByText } = await open(
      source(StepsStatus.Connected),
    );
    expect(queryByLabelText('Off. Tap to allow access to steps')).toBeNull();
    fireEvent.press(getByText('Sync now'));
    await findByText('Steps synced.');
  });

  it('Sync now says so when reading steps fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const repo = source(StepsStatus.Connected);
    const { findByText, getByText } = await open(repo);
    repo.fail = true;
    fireEvent.press(getByText('Sync now'));
    await findByText("Couldn't sync your steps — please try again.");
    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });
});
