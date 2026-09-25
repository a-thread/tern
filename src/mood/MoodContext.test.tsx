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
import { MoodProvider, useMood } from './MoodContext';

const today = dayKey();

async function setup(backend: Backend = createMemoryBackend()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BackendProvider backend={backend}>
      <ToastProvider>
        <SettingsProvider>
          <FoodProvider>
            <WaypointsProvider>
              <MoodProvider>{children}</MoodProvider>
            </WaypointsProvider>
          </FoodProvider>
        </SettingsProvider>
      </ToastProvider>
    </BackendProvider>
  );
  const hook = renderHook(
    () => ({ mood: useMood(), settings: useSettings(), points: useWaypoints() }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.mood.ready).toBe(true);
    expect(hook.result.current.settings.ready).toBe(true);
    expect(hook.result.current.points.ready).toBe(true);
  });
  return { ...hook, backend };
}

const turnOn = async (result: { current: { settings: ReturnType<typeof useSettings> } }) =>
  act(async () => {
    result.current.settings.updateSettings({ trackMood: true });
  });

const hasAward = (result: { current: { points: ReturnType<typeof useWaypoints> } }) =>
  result.current.points.events.some((e) => e.source === 'mood' && e.day === today);

describe('MoodProvider', () => {
  it('is off until mood tracking is turned on, with no check-in yet', async () => {
    const { result } = await setup();
    expect(result.current.mood.enabled).toBe(false);
    expect(result.current.mood.today).toBeUndefined();
  });

  it('saves a check-in, and checking in again replaces it', async () => {
    const { result, backend } = await setup();
    await turnOn(result);
    let ok = false;
    await act(async () => {
      ok = result.current.mood.checkIn(7, 3);
    });
    expect(ok).toBe(true);
    expect(result.current.mood.today).toEqual({ day: today, mood: 7, stress: 3 });
    await act(async () => {
      result.current.mood.checkIn(4, 8);
    });
    expect(result.current.mood.entries).toHaveLength(1);
    expect(await backend.mood.load(today, today)).toEqual([{ day: today, mood: 4, stress: 8 }]);
  });

  it('refuses a score off the scale', async () => {
    const { result } = await setup();
    await turnOn(result);
    let ok = true;
    await act(async () => {
      ok = result.current.mood.checkIn(0, 11);
    });
    expect(ok).toBe(false);
    expect(result.current.mood.today).toBeUndefined();
  });

  it('picks up earlier check-ins for the trend, and finds the one from today', async () => {
    const backend = createMemoryBackend();
    await backend.mood.save({ day: '2026-01-01', mood: 5, stress: 5 });
    await backend.mood.save({ day: today, mood: 8, stress: 2 });
    const { result } = await setup(backend);
    expect(result.current.mood.today).toEqual({ day: today, mood: 8, stress: 2 });
  });

  it('removing the check-in from today leaves the others', async () => {
    const backend = createMemoryBackend();
    await backend.mood.save({ day: today, mood: 8, stress: 2 });
    const { result } = await setup(backend);
    await act(async () => {
      result.current.mood.clearToday();
    });
    expect(result.current.mood.today).toBeUndefined();
    expect(await backend.mood.load(today, today)).toEqual([]);
  });

  it('awards the waypoint for checking in, and takes it back if the check-in is removed', async () => {
    const { result } = await setup();
    await turnOn(result);
    expect(hasAward(result)).toBe(false);
    await act(async () => {
      result.current.mood.checkIn(6, 6);
    });
    await waitFor(() => expect(hasAward(result)).toBe(true));
    await act(async () => {
      result.current.mood.clearToday();
    });
    await waitFor(() => expect(hasAward(result)).toBe(false));
  });

  it('awards the same whatever the numbers are', async () => {
    const { result } = await setup();
    await turnOn(result);
    await act(async () => {
      result.current.mood.checkIn(1, 10);
    });
    await waitFor(() => expect(hasAward(result)).toBe(true));
  });

  it('awards nothing while tracking is off', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.mood.checkIn(6, 6);
    });
    expect(hasAward(result)).toBe(false);
  });

  it('rolls back and tells the person when saving fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const backend = createMemoryBackend();
    backend.mood.save = async () => {
      throw new Error('offline');
    };
    const { result } = await setup(backend);
    await turnOn(result);
    await act(async () => {
      result.current.mood.checkIn(6, 6);
    });
    await waitFor(() => expect(result.current.mood.today).toBeUndefined());
    warn.mockRestore();
  });
});
