import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import {
  BackendProvider,
  createMemoryBackend,
  type Backend,
} from '@shared/state/BackendContext';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { FoodProvider } from '@food/FoodContext';
import { createMemoryFoodRepository } from '@food/repository';
import { createMemoryWaypointsRepository } from './repository';
import { WaypointsProvider, useWaypoints } from './WaypointsContext';
import { MILESTONE_STOPS } from './models';
import { usePendingMilestone } from './usePendingMilestone';

const FIRST_STOP = MILESTONE_STOPS[0];
const SECOND_STOP = MILESTONE_STOPS[1];

/** A ledger holding `total` from before today, with no awards made today. */
const ledgerWith = (total: number) => createMemoryWaypointsRepository(total, []);

/**
 * The hook over a backend holding exactly `total` waypoints: an empty food log
 * too, so the seed log's meals bonus doesn't move the total under the test.
 */
async function setup(total: number) {
  const backend: Backend = {
    ...createMemoryBackend(),
    waypoints: ledgerWith(total),
    food: createMemoryFoodRepository([]),
  };
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BackendProvider backend={backend}>
      <SettingsProvider>
        <FoodProvider>
          <WaypointsProvider>{children}</WaypointsProvider>
        </FoodProvider>
      </SettingsProvider>
    </BackendProvider>
  );
  const hook = renderHook(
    () => ({
      milestone: usePendingMilestone(),
      points: useWaypoints(),
      settings: useSettings(),
    }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.points.ready).toBe(true);
    expect(hook.result.current.settings.ready).toBe(true);
  });
  return hook;
}

describe('usePendingMilestone', () => {
  it('celebrates nothing for a journey that was already past a stop when Tern first looked', async () => {
    const { result } = await setup(FIRST_STOP.waypoints + 50);
    await waitFor(() =>
      expect(result.current.settings.settings.celebratedMilestone).toBe(
        FIRST_STOP.waypoints,
      ),
    );
    expect(result.current.milestone.pending).toBeNull();
  });

  it('has nothing pending before the first stop', async () => {
    const { result } = await setup(FIRST_STOP.waypoints - 10);
    await waitFor(() =>
      expect(result.current.settings.settings.celebratedMilestone).toBe(0),
    );
    expect(result.current.milestone.pending).toBeNull();
  });

  it('offers the stop just crossed, once, and stays quiet afterwards', async () => {
    const { result } = await setup(FIRST_STOP.waypoints - 10);
    await waitFor(() =>
      expect(result.current.settings.settings.celebratedMilestone).toBe(0),
    );

    // An ordinary award tips the total over the first stop.
    await act(async () => result.current.points.addWaypoints(40, 'steps'));
    await waitFor(() =>
      expect(result.current.milestone.pending).toMatchObject({
        name: FIRST_STOP.name,
        lap: 1,
      }),
    );

    const reached = result.current.milestone.pending!;
    await act(async () => result.current.milestone.markCelebrated(reached));
    await waitFor(() => expect(result.current.milestone.pending).toBeNull());
    expect(result.current.settings.settings.celebratedMilestone).toBe(
      FIRST_STOP.waypoints,
    );
  });

  it('keeps the next stop waiting until it is actually reached', async () => {
    const { result } = await setup(FIRST_STOP.waypoints);
    await waitFor(() =>
      expect(result.current.settings.settings.celebratedMilestone).toBe(
        FIRST_STOP.waypoints,
      ),
    );
    await act(async () =>
      result.current.points.addWaypoints(
        SECOND_STOP.waypoints - FIRST_STOP.waypoints,
        'steps',
      ),
    );
    await waitFor(() =>
      expect(result.current.milestone.pending).toMatchObject({
        name: SECOND_STOP.name,
      }),
    );
  });
});
