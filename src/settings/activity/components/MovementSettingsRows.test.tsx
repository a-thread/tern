import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';

import { createMemoryBackend } from '../../../BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { SettingsProvider } from '@/domain/settings/SettingsContext';
import { WaypointsProvider } from '@/domain/waypoints/WaypointsContext';
import { MovementProvider } from '@/domain/movement/MovementContext';
import type { WorkoutsSource } from '@/domain/movement/movement.healthconnect';
import { MovementSettingsRows } from './MovementSettingsRows';

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

async function open(workouts: WorkoutsSource | null) {
  const backend = createMemoryBackend();
  const ui = render(
    <ToastProvider>
      <SettingsProvider repo={backend.settings}>
        <WaypointsProvider repo={backend.waypoints}>
          <MovementProvider repo={backend.movement} workouts={workouts}>
            <MovementSettingsRows />
          </MovementProvider>
        </WaypointsProvider>
      </SettingsProvider>
    </ToastProvider>,
  );
  await act(async () => {}); // let the first load settle
  return ui;
}

// The toggle has no label yet, and with movement off it's the only pressable here.
const turnOn = (ui: Awaited<ReturnType<typeof open>>) =>
  act(async () => {
    fireEvent.press(
      ui.UNSAFE_root.findAll(
        (n: { props: { onPress?: unknown } }) =>
          typeof n.props.onPress === 'function',
      )[0],
    );
  });

describe('Track movement', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('asks to read workouts when turned on', async () => {
    const workouts = workoutSource();
    const ui = await open(workouts);
    await turnOn(ui);
    expect(workouts.asked).toBe(1);
    expect(ui.queryByText(/Allow Tern to read workouts/)).toBeNull();
  });

  it('says so when workouts were refused', async () => {
    const ui = await open(workoutSource(false));
    await turnOn(ui);
    await ui.findByText(
      'Allow Tern to read workouts in Health Connect to count them.',
    );
  });

  it('does not ask where workouts are not available', async () => {
    const ui = await open(null);
    await turnOn(ui);
    expect(ui.queryByText(/Allow Tern to read workouts/)).toBeNull();
  });
});
