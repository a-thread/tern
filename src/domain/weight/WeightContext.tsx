import React, { useCallback, useMemo } from 'react';
import type { WeightRepository } from './weight.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useSyncedList } from '@shared/hooks/useSyncedList';
import { newId } from '@shared/utils/id';
import { computeTrend } from './models/weightTrend';
import { isLoggedToday, type WeightEntry } from './models/weightEntry';
import { useSettings } from '../settings/SettingsContext';
import { useAward } from '../waypoints/hooks/useAward';
import { WaypointSource } from '../waypoints/models/waypoint';
import { useDayKey } from '@shared/hooks/useDayKey';

type WeightContextValue = {
  /** Newest first. */
  weightEntries: WeightEntry[];
  /** Smoothed trend, oldest to newest. Empty until something is logged. */
  weightTrend: number[];
  ready: boolean;
  /** Reads everything again from storage (pull to refresh). */
  reload: () => Promise<unknown>;
  /** Logs a weigh-in, now unless `loggedAt` says otherwise (filling in yesterday). */
  addWeightEntry: (lb: number, loggedAt?: string) => void;
  /** Corrects an existing weigh-in in place, keeping when it was logged. */
  updateWeightEntry: (id: string, lb: number) => void;
};

const [WeightContext, useWeight] = createRequiredContext<WeightContextValue>(
  'useWeight',
  'WeightProvider',
);
export { useWeight };

export function WeightProvider({
  repo: weight,
  children,
}: {
  repo: WeightRepository;
  children: React.ReactNode;
}) {
  const {
    entries: weightEntries,
    ready,
    reload,
    change,
  } = useSyncedList(
    useCallback(() => weight.load(), [weight]),
    'Could not load weight entries',
  );

  // A weigh-in earns its waypoint for being logged, whatever it says. Taken back if today's is
  // removed; nothing happens while weight tracking is off.
  const { settings } = useSettings();
  const today = useDayKey();
  const weighedToday = useMemo(
    () =>
      weightEntries.some((e) =>
        isLoggedToday(e.loggedAt, new Date(`${today}T12:00:00`)),
      ),
    [weightEntries, today],
  );
  useAward(WaypointSource.Weight, weighedToday, settings.trackWeight && ready);

  const addWeightEntry = useCallback(
    (lb: number, loggedAt: string = new Date().toISOString()) => {
      const entry: WeightEntry = { id: newId(), lb, loggedAt };
      // Newest first, wherever a back-dated one lands.
      change(
        (prev) =>
          [entry, ...prev].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)),
        weight.add(entry),
        {
          log: 'Could not save weight entry',
          toast: "Couldn't save that weigh-in — please try again.",
        },
      );
    },
    [weight, change],
  );

  const updateWeightEntry = useCallback(
    (id: string, lb: number) => {
      change(
        (prev) => prev.map((e) => (e.id === id ? { ...e, lb } : e)),
        weight.update(id, lb),
        {
          log: 'Could not update weight entry',
          toast: "Couldn't save that change — please try again.",
        },
      );
    },
    [weight, change],
  );

  const weightTrend = useMemo(
    () => computeTrend(weightEntries),
    [weightEntries],
  );

  const value = useMemo<WeightContextValue>(
    () => ({
      weightEntries,
      weightTrend,
      ready,
      reload,
      addWeightEntry,
      updateWeightEntry,
    }),
    [
      weightEntries,
      weightTrend,
      ready,
      reload,
      addWeightEntry,
      updateWeightEntry,
    ],
  );

  return (
    <WeightContext.Provider value={value}>{children}</WeightContext.Provider>
  );
}
