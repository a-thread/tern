import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '@shared/state/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { dayKey } from '@shared/utils/date';
import { FoodProvider } from '@food/FoodContext';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';
import { WaterProvider, useWater } from './WaterContext';

const today = dayKey();

async function setup(backend: Backend = createMemoryBackend()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BackendProvider backend={backend}>
      <ToastProvider>
        <SettingsProvider>
          <FoodProvider>
            <WaypointsProvider>
              <WaterProvider>{children}</WaterProvider>
            </WaypointsProvider>
          </FoodProvider>
        </SettingsProvider>
      </ToastProvider>
    </BackendProvider>
  );
  const hook = renderHook(
    () => ({ water: useWater(), settings: useSettings(), points: useWaypoints() }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.water.ready).toBe(true);
    expect(hook.result.current.settings.ready).toBe(true);
    expect(hook.result.current.points.ready).toBe(true);
  });
  return { ...hook, backend };
}

const turnOn = async (
  result: { current: { settings: ReturnType<typeof useSettings> } },
  goalOz = 32,
) =>
  act(async () => {
    result.current.settings.updateSettings({ trackWater: true, waterGoalOz: goalOz });
  });

const hasWaterAward = (result: { current: { points: ReturnType<typeof useWaypoints> } }) =>
  result.current.points.events.some((e) => e.source === 'water' && e.day === today);

describe('WaterProvider', () => {
  it('is off until water tracking is turned on, and starts at zero', async () => {
    const { result } = await setup();
    expect(result.current.water.enabled).toBe(false);
    expect(result.current.water.totalOz).toBe(0);
  });

  it('adds drinks up, saves them, and counts toward the goal', async () => {
    const { result, backend } = await setup();
    await turnOn(result, 32);
    let ok = false;
    await act(async () => {
      ok = result.current.water.addWater(8);
      result.current.water.addWater(8.45);
    });
    expect(ok).toBe(true);
    expect(result.current.water.totalOz).toBe(16.45);
    expect(result.current.water.progress).toBeCloseTo(0.514, 2);
    expect(result.current.water.reached).toBe(false);
    expect((await backend.water.load(today, today)).map((e) => e.oz)).toEqual([8, 8.45]);
  });

  it('refuses an amount it cannot store', async () => {
    const { result } = await setup();
    await turnOn(result);
    let ok = true;
    await act(async () => {
      ok = result.current.water.addWater(0);
    });
    expect(ok).toBe(false);
    expect(result.current.water.totalOz).toBe(0);
  });

  it('refuses more than the database holds and stores hundredths of an ounce', async () => {
    const { result, backend } = await setup();
    await turnOn(result);
    let tooMuch = true;
    await act(async () => {
      tooMuch = result.current.water.addWater(171);
      result.current.water.addWater(8.4533);
    });
    expect(tooMuch).toBe(false);
    expect((await backend.water.load(today, today)).map((e) => e.oz)).toEqual([8.45]);
  });

  it('undo removes the most recent drink only', async () => {
    const { result, backend } = await setup();
    await turnOn(result);
    await act(async () => {
      result.current.water.addWater(8);
    });
    await act(async () => {
      result.current.water.addWater(16);
    });
    expect(result.current.water.lastOz).toBe(16);
    await act(async () => {
      result.current.water.undoLast();
    });
    expect(result.current.water.totalOz).toBe(8);
    expect((await backend.water.load(today, today)).map((e) => e.oz)).toEqual([8]);
  });

  it('picks up what was already logged today, and ignores other days', async () => {
    const backend = createMemoryBackend();
    await backend.water.add({ id: 'a', oz: 12, loggedOn: today, loggedAt: new Date().toISOString() });
    await backend.water.add({ id: 'b', oz: 30, loggedOn: '2000-01-01', loggedAt: '2000-01-01T08:00:00.000Z' });
    const { result } = await setup(backend);
    expect(result.current.water.totalOz).toBe(12);
  });

  it('awards the water waypoint on reaching the goal and takes it back if a drink is undone', async () => {
    const { result } = await setup();
    await turnOn(result, 32);
    expect(hasWaterAward(result)).toBe(false);

    await act(async () => {
      result.current.water.addWater(32);
    });
    await waitFor(() => expect(hasWaterAward(result)).toBe(true));
    expect(result.current.water.reached).toBe(true);

    await act(async () => {
      result.current.water.undoLast();
    });
    await waitFor(() => expect(hasWaterAward(result)).toBe(false));
  });

  it('awards nothing while water tracking is off', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.settings.updateSettings({ waterGoalOz: 16 });
      result.current.water.addWater(20);
    });
    expect(result.current.water.enabled).toBe(false);
    expect(hasWaterAward(result)).toBe(false);
  });

  it('turning tracking off later does not take back a waypoint already earned', async () => {
    const { result } = await setup();
    await turnOn(result, 16);
    await act(async () => {
      result.current.water.addWater(16);
    });
    await waitFor(() => expect(hasWaterAward(result)).toBe(true));
    await act(async () => {
      result.current.settings.updateSettings({ trackWater: false });
    });
    expect(hasWaterAward(result)).toBe(true);
  });

  it('rolls back and tells the person when saving a drink fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const backend = createMemoryBackend();
    backend.water.add = async () => {
      throw new Error('offline');
    };
    const { result } = await setup(backend);
    await turnOn(result);
    await act(async () => {
      result.current.water.addWater(8);
    });
    await waitFor(() => expect(result.current.water.totalOz).toBe(0));
    warn.mockRestore();
  });
});
