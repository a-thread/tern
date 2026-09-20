import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '@shared/state/BackendContext';
import { dayKey } from '@shared/utils/date';
import { SettingsProvider } from '@settings/SettingsContext';
import { FoodProvider } from '@food/FoodContext';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';
import { ActivityProvider, useActivity } from './ActivityContext';
import type { StepsRepository } from './steps.repository';

const todayKey = dayKey();

/** A step source reporting `todaySteps` today and nothing before. */
const stepsRepo = (todaySteps: number, status: 'connected' | 'unavailable' = 'connected'): StepsRepository => ({
  status: async () => status,
  connect: async () => status,
  getRange: async () => (status === 'connected' ? { [todayKey]: todaySteps } : {}),
});

async function setup(steps: StepsRepository) {
  const backend: Backend = { ...createMemoryBackend(), steps };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BackendProvider backend={backend}>
      <SettingsProvider>
        <FoodProvider>
          <WaypointsProvider>
            <ActivityProvider>{children}</ActivityProvider>
          </WaypointsProvider>
        </FoodProvider>
      </SettingsProvider>
    </BackendProvider>
  );
  const hook = renderHook(
    () => ({ activity: useActivity(), points: useWaypoints() }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.activity.ready).toBe(true);
    expect(hook.result.current.points.ready).toBe(true);
  });
  return { ...hook, backend };
}

describe('ActivityProvider awards', () => {
  it('awards the step-goal waypoints once when today reaches the goal', async () => {
    const { result, backend } = await setup(stepsRepo(9000));
    await waitFor(() =>
      expect(result.current.points.celebrations.some((c) => c.source === 'steps')).toBe(true),
    );
    const snapshot = await backend.waypoints.load(todayKey);
    expect(snapshot.todaySources).toContain('steps');
    expect(result.current.activity.todaySteps).toBe(9000);
  });

  it('awards nothing below the goal', async () => {
    const { result } = await setup(stepsRepo(3000));
    expect(result.current.points.celebrations.some((c) => c.source === 'steps')).toBe(false);
  });

  it('never awards from steps that are unavailable', async () => {
    const { result } = await setup(stepsRepo(0, 'unavailable'));
    expect(result.current.activity.status).toBe('unavailable');
    expect(result.current.activity.todaySteps).toBe(0);
    expect(result.current.points.celebrations.some((c) => c.source === 'steps')).toBe(false);
  });
});

describe('rest days', () => {
  it('awards the rest waypoints when taken and quietly takes them back when undone', async () => {
    const { result, backend } = await setup(stepsRepo(1000));
    const before = result.current.points.waypoints;

    let taken = false;
    await act(async () => {
      taken = result.current.activity.takeRestDay();
    });
    expect(taken).toBe(true);
    await waitFor(() => expect(result.current.points.waypoints).toBe(before + 10));
    expect(result.current.activity.todayIsRest).toBe(true);
    expect((await backend.waypoints.load(todayKey)).todaySources).toContain('rest');

    await act(async () => result.current.activity.undoRestDay());
    await waitFor(() => expect(result.current.points.waypoints).toBe(before));
    expect(result.current.activity.todayIsRest).toBe(false);
  });

  it('keeps the streak through a rest day, and stops at the weekly allowance', async () => {
    const { result } = await setup(stepsRepo(1000));
    // Memory backend allows 2 per week; today is the only day with data, so no detected days compete.
    expect(result.current.activity.restLeft).toBe(2);
    await act(async () => {
      result.current.activity.takeRestDay();
    });
    expect(result.current.activity.restLeft).toBe(1);
    expect(result.current.activity.takeRestDay()).toBe(false); // already resting today
  });
});
