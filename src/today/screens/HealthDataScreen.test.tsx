import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  createMemoryBackend,
  type Backend,
} from '@app/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { FoodProvider } from '@food/FoodContext';
import { WaypointsProvider } from '@journey/WaypointsContext';
import { ActivityProvider } from '@today/ActivityContext';
import { StepsRepository, StepsStatus } from '@today/data/steps.repository';
import { SettingsProvider } from '@settings/SettingsContext';
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

async function open(steps: StepsRepository) {
  const backend: Backend = { ...createMemoryBackend(), steps };
  const ui = render(
    <SafeAreaProvider initialMetrics={metrics}>
        <ToastProvider>
          <SettingsProvider repo={backend.settings}>
            <WaypointsProvider repo={backend.waypoints}>
              <FoodProvider repo={backend.food}>
                <ActivityProvider steps={backend.steps} restDays={backend.restDays}>
                  <HealthDataScreen />
                </ActivityProvider>
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
  it('tapping the Off chip asks for access and says it worked', async () => {
    const { findByText, getByLabelText } = await open(source(StepsStatus.NeedsPermission, StepsStatus.Connected));
    fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
    await findByText('Health Connect is connected.');
  });

  it('says so when Health Connect is not available on the device', async () => {
    const { findByText, getByLabelText } = await open(source(StepsStatus.Unavailable));
    fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
    await findByText("Health Connect isn't available on this device.");
  });

  it('says so when permission was not granted', async () => {
    const { findByText, getByLabelText } = await open(source(StepsStatus.NeedsPermission));
    fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
    await findByText('Tern still needs permission to read your steps.');
  });

  it('has no Off button once connected, and Sync now confirms with a message', async () => {
    const { findByText, queryByLabelText, getByText } = await open(source(StepsStatus.Connected));
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
