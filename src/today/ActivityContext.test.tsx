import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '@shared/state/BackendContext';
import { dayKey } from '@shared/utils/date';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
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
    () => ({ activity: useActivity(), points: useWaypoints(), settings: useSettings() }),
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

  it("takes today's step award back if the goal is raised past today's steps", async () => {
    const { result } = await setup(stepsRepo(5000)); // the default goal is 4,800
    await waitFor(() =>
      expect(result.current.points.events.some((e) => e.source === 'steps')).toBe(true),
    );
    const withSteps = result.current.points.waypoints;

    await act(async () => result.current.settings.updateSettings({ stepGoal: 8000 }));
    await waitFor(() => expect(result.current.points.waypoints).toBe(withSteps - 40));
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

  it('a rest day taken early gives way to the goal: one award, and the allowance comes back', async () => {
    let steps = 1000;
    const repo: StepsRepository = {
      status: async () => 'connected',
      connect: async () => 'connected',
      getRange: async () => ({ [todayKey]: steps }),
    };
    const { result } = await setup(repo);
    const before = result.current.points.waypoints;
    await act(async () => {
      result.current.activity.takeRestDay();
    });
    await waitFor(() => expect(result.current.points.waypoints).toBe(before + 10));
    expect(result.current.activity.restLeft).toBe(1);

    steps = 9000;
    await act(async () => {
      await result.current.activity.refresh();
    });
    await waitFor(() => expect(result.current.points.waypoints).toBe(before + 40));
    const sources = result.current.points.events
      .filter((e) => e.day === todayKey)
      .map((e) => e.source);
    expect(sources).toContain('steps');
    expect(sources).not.toContain('rest');
    expect(result.current.activity.restLeft).toBe(2);
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

describe('refreshing', () => {
  it('a refresh that finds the same data changes nothing screens can see', async () => {
    // getRange returns a brand-new (but equal) object each call, like a real read would.
    const { result } = await setup(stepsRepo(3000));
    const before = result.current.activity;
    await act(async () => {
      await result.current.activity.refresh();
      await result.current.activity.refresh();
    });
    expect(result.current.activity).toBe(before);
  });

  it('a refresh that finds new steps does update', async () => {
    let steps = 3000;
    const repo: StepsRepository = {
      status: async () => 'connected',
      connect: async () => 'connected',
      getRange: async () => ({ [todayKey]: steps }),
    };
    const { result } = await setup(repo);
    expect(result.current.activity.todaySteps).toBe(3000);
    steps = 5200;
    await act(async () => {
      await result.current.activity.refresh();
    });
    expect(result.current.activity.todaySteps).toBe(5200);
  });
});

describe('reporting the result of a refresh and of connecting', () => {
  it('a refresh reports the step status it found', async () => {
    const { result } = await setup(stepsRepo(3000));
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.activity.refresh();
    });
    expect(outcome).toBe('connected');
  });

  it("a refresh reports 'failed' when steps can't be read, instead of throwing", async () => {
    let broken = false;
    const repo: StepsRepository = {
      status: async () => 'connected',
      connect: async () => 'connected',
      getRange: async () => {
        if (broken) throw new Error('Health Connect is unreachable');
        return { [todayKey]: 3000 };
      },
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = await setup(repo);
    broken = true;
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.activity.refresh();
    });
    expect(outcome).toBe('failed');
    expect(result.current.activity.todaySteps).toBe(3000); // what was there stays
    warn.mockRestore();
  });

  it('connecting reports whether access was granted', async () => {
    let granted = false;
    const repo: StepsRepository = {
      status: async () => (granted ? 'connected' : 'needs-permission'),
      connect: async () => {
        granted = true;
        return 'connected';
      },
      getRange: async () => ({ [todayKey]: 4200 }),
    };
    const { result } = await setup(repo);
    expect(result.current.activity.status).toBe('needs-permission');
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.activity.connect();
    });
    expect(outcome).toBe('connected');
    await waitFor(() => expect(result.current.activity.todaySteps).toBe(4200));
  });

  it("connecting on a device without Health Connect stays 'unavailable'", async () => {
    const { result } = await setup(stepsRepo(0, 'unavailable'));
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.activity.connect();
    });
    expect(outcome).toBe('unavailable');
  });
});
