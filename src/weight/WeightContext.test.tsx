import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createMemoryBackend, type Backend } from '@app/BackendContext';
import { createMemoryWeightRepository } from '@weight/data/weight.repository';
import { ToastProvider } from '@shared/state/ToastContext';
import { SettingsProvider, useSettings } from '@settings/SettingsContext';
import { WaypointsProvider, useWaypoints } from '@journey/WaypointsContext';
import { WeightProvider, useWeight } from './WeightContext';

/** A backend where nothing has been weighed today (the local seed has a weigh-in every day). */
const unweighed = (): Backend => ({ ...createMemoryBackend(), weight: createMemoryWeightRepository([]) });

async function setup(backend: Backend = unweighed()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <SettingsProvider repo={backend.settings}>
        <WaypointsProvider repo={backend.waypoints}>
          <WeightProvider repo={backend.weight}>{children}</WeightProvider>
        </WaypointsProvider>
      </SettingsProvider>
    </ToastProvider>
  );
  const hook = renderHook(
    () => ({ weight: useWeight(), settings: useSettings(), points: useWaypoints() }),
    { wrapper },
  );
  await waitFor(() => {
    expect(hook.result.current.weight.ready).toBe(true);
    expect(hook.result.current.settings.ready).toBe(true);
    expect(hook.result.current.points.ready).toBe(true);
  });
  return hook;
}

describe('the weigh-in waypoint', () => {
  it('is earned for logging a weigh-in, once a day, whatever the number', async () => {
    const { result } = await setup();
    const before = result.current.points.waypoints;

    await act(async () => result.current.weight.addWeightEntry(163.4));
    await waitFor(() => expect(result.current.points.waypoints).toBe(before + 5));

    await act(async () => result.current.weight.addWeightEntry(180));
    expect(result.current.points.waypoints).toBe(before + 5);
  });

  it('is not earned while weight tracking is off', async () => {
    const { result } = await setup();
    await act(async () => result.current.settings.updateSettings({ trackWeight: false }));
    const before = result.current.points.waypoints;

    await act(async () => result.current.weight.addWeightEntry(163.4));
    expect(result.current.points.waypoints).toBe(before);
  });
});

describe('editing a weigh-in', () => {
  it('changes the number in place without adding an entry or another waypoint', async () => {
    const { result } = await setup();
    await act(async () => result.current.weight.addWeightEntry(163.4));
    await waitFor(() => expect(result.current.weight.weightEntries).toHaveLength(1));
    const [entry] = result.current.weight.weightEntries;
    const points = result.current.points.waypoints;

    await act(async () => result.current.weight.updateWeightEntry(entry.id, 161.8));

    expect(result.current.weight.weightEntries).toHaveLength(1);
    expect(result.current.weight.weightEntries[0]).toMatchObject({ id: entry.id, lb: 161.8, loggedAt: entry.loggedAt });
    expect(result.current.points.waypoints).toBe(points);
  });
});
