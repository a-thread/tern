import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createMemoryBackend, type Backend } from '@app/BackendContext';
import { ToastProvider } from '@shared/state/ToastContext';
import { addDays, dayKey } from '@shared/utils/date';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';
import { FoodProvider } from '@food/FoodContext';
import { ActivityProvider, useActivity } from '@today/ActivityContext';
import { createUnavailableStepsRepository } from '@today/data/steps.repository';
import { DayState } from '@shared/models/dayState';
import { Activity, Effort } from '@movement/models/movementEntry';
import { MovementProvider, useMovement } from './MovementContext';

async function setup() {
  // No steps at all, so only movement can make today a goal day.
  const backend: Backend = { ...createMemoryBackend(), steps: createUnavailableStepsRepository() };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <SettingsProvider repo={backend.settings}>
        <WaypointsProvider repo={backend.waypoints}>
          <FoodProvider repo={backend.food}>
            <MovementProvider repo={backend.movement}>
              <ActivityProvider steps={backend.steps} restDays={backend.restDays}>
                {children}
              </ActivityProvider>
            </MovementProvider>
          </FoodProvider>
        </WaypointsProvider>
      </SettingsProvider>
    </ToastProvider>
  );
  const hook = renderHook(
    () => ({ movement: useMovement(), activity: useActivity(), points: useWaypoints(), settings: useSettings() }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.movement.ready).toBe(true);
    expect(hook.result.current.activity.ready).toBe(true);
    expect(hook.result.current.points.ready).toBe(true);
  });
  await act(async () => hook.result.current.settings.updateSettings({ trackMovement: true }));
  return hook;
}

const today = () => dayKey();

describe('MovementProvider', () => {
  it('logs movement for today and yesterday, but not before', async () => {
    const { result } = await setup();
    let ok = false;
    await act(async () => {
      ok = result.current.movement.add({ day: today(), activity: Activity.Swim, minutes: 20, effort: null });
    });
    expect(ok).toBe(true);
    await act(async () => {
      ok = result.current.movement.add({ day: addDays(today(), -1), activity: Activity.Walk, minutes: 15, effort: Effort.Easy });
    });
    expect(ok).toBe(true);
    await act(async () => {
      ok = result.current.movement.add({ day: addDays(today(), -2), activity: Activity.Walk, minutes: 15, effort: null });
    });
    expect(ok).toBe(false);
    expect(result.current.movement.todayMinutes).toBe(20);
    expect(result.current.movement.minutesByDay[addDays(today(), -1)]).toBe(15);
  });

  it('earns the movement waypoint, and makes a goal day at the minutes goal', async () => {
    const { result } = await setup();
    const before = result.current.points.waypoints;

    await act(async () => {
      result.current.movement.add({ day: today(), activity: Activity.Swim, minutes: 20, effort: null });
    });
    await waitFor(() => expect(result.current.points.waypoints).toBe(before + 10));
    expect(result.current.activity.week.find((d) => d.isToday)?.state).not.toBe(DayState.Goal);

    await act(async () => {
      result.current.movement.add({ day: today(), activity: Activity.Bike, minutes: 15, effort: null });
    });
    // 35 minutes passes the default 30: a goal day, and its 40 waypoints.
    await waitFor(() => expect(result.current.activity.week.find((d) => d.isToday)?.state).toBe(DayState.Goal));
    await waitFor(() => expect(result.current.points.waypoints).toBe(before + 50));
  });

  it('takes it all back when the movement is removed', async () => {
    const { result } = await setup();
    const before = result.current.points.waypoints;
    await act(async () => {
      result.current.movement.add({ day: today(), activity: Activity.Strength, minutes: 40, effort: Effort.Hard });
    });
    await waitFor(() => expect(result.current.points.waypoints).toBe(before + 50));

    const id = result.current.movement.entries[0].id;
    await act(async () => result.current.movement.remove(id));
    await waitFor(() => expect(result.current.points.waypoints).toBe(before));
    expect(result.current.activity.week.find((d) => d.isToday)?.state).not.toBe(DayState.Goal);
  });

  it('logs walks and runs without counting them toward a goal day, since steps already do', async () => {
    const { result } = await setup();
    const before = result.current.points.waypoints;
    await act(async () => {
      result.current.movement.add({ day: today(), activity: Activity.Walk, minutes: 45, effort: null });
      result.current.movement.add({ day: today(), activity: Activity.Run, minutes: 30, effort: null });
    });
    await waitFor(() => expect(result.current.points.waypoints).toBe(before + 10));
    expect(result.current.movement.todayMinutes).toBe(75);
    expect(result.current.movement.todayGoalMinutes).toBe(0);
    expect(result.current.activity.week.find((d) => d.isToday)?.state).not.toBe(DayState.Goal);
  });

  it('shows nothing and counts nothing while tracking is off', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.movement.add({ day: today(), activity: Activity.Run, minutes: 40, effort: null });
    });
    await act(async () => result.current.settings.updateSettings({ trackMovement: false }));
    expect(result.current.movement.entries).toEqual([]);
    expect(result.current.movement.todayMinutes).toBe(0);
    expect(result.current.activity.week.find((d) => d.isToday)?.state).not.toBe(DayState.Goal);
  });
});
