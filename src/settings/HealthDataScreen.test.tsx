import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '@shared/state/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { FoodProvider } from '@food/FoodContext';
import { WaypointsProvider } from '@journey/WaypointsContext';
import { ActivityProvider } from '@today/ActivityContext';
import type { StepsRepository, StepsStatus } from '@today/steps.repository';
import { SettingsProvider } from './SettingsContext';
import HealthDataScreen from './HealthDataScreen';

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
      return status === 'connected' ? { [today]: 3000 } : {};
    },
  };
  return repo;
}

async function open(steps: StepsRepository) {
  const backend: Backend = { ...createMemoryBackend(), steps };
  const ui = render(
    <SafeAreaProvider initialMetrics={metrics}>
      <BackendProvider backend={backend}>
        <ToastProvider>
          <SettingsProvider>
            <FoodProvider>
              <WaypointsProvider>
                <ActivityProvider>
                  <HealthDataScreen
                    navigation={{ goBack: jest.fn() } as never}
                    route={{ key: 'k', name: 'HealthData' } as never}
                  />
                </ActivityProvider>
              </WaypointsProvider>
            </FoodProvider>
          </SettingsProvider>
        </ToastProvider>
      </BackendProvider>
    </SafeAreaProvider>,
  );
  await act(async () => {}); // let the first load settle
  return ui;
}

describe('Health data screen', () => {
  it('tapping the Off chip asks for access and says it worked', async () => {
    const { findByText, getByLabelText } = await open(source('needs-permission', 'connected'));
    fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
    await findByText('Health Connect is connected.');
  });

  it('says so when Health Connect is not available on the device', async () => {
    const { findByText, getByLabelText } = await open(source('unavailable'));
    fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
    await findByText("Health Connect isn't available on this device.");
  });

  it('says so when permission was not granted', async () => {
    const { findByText, getByLabelText } = await open(source('needs-permission'));
    fireEvent.press(getByLabelText('Off. Tap to allow access to steps'));
    await findByText('Tern still needs permission to read your steps.');
  });

  it('has no Off button once connected, and Sync now confirms with a message', async () => {
    const { findByText, queryByLabelText, getByText } = await open(source('connected'));
    expect(queryByLabelText('Off. Tap to allow access to steps')).toBeNull();
    fireEvent.press(getByText('Sync now'));
    await findByText('Steps synced.');
  });

  it('Sync now says so when reading steps fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const repo = source('connected');
    const { findByText, getByText } = await open(repo);
    repo.fail = true;
    fireEvent.press(getByText('Sync now'));
    await findByText("Couldn't sync your steps — please try again.");
    await waitFor(() => expect(warn).toHaveBeenCalled());
    warn.mockRestore();
  });
});
