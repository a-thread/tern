import React, { useCallback, useMemo, useState } from 'react';
import type { WeightRepository } from './weight.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useSyncedList } from '@shared/hooks/useSyncedList';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { dayKey } from '@shared/utils/date';
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
  /** Whether `day` (YYYY-MM-DD) was marked "not weighing in". */
  isWeighInSkipped: (day: string) => boolean;
  /** Marks `day` as not weighing in (or takes the mark back). It earns nothing and is not a weigh-in. */
  setWeighInSkipped: (day: string, skipped: boolean) => void;
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
    ready: entriesReady,
    reload: reloadEntries,
    change,
  } = useSyncedList(
    useCallback(() => weight.load(), [weight]),
    'Could not load weight entries',
  );

  const [skippedDays, setSkippedDays] = useState<string[]>([]);
  const { ready: skippedReady, reload: reloadSkipped } = useLoader(
    useCallback(() => weight.loadSkipped(), [weight]),
    setSkippedDays,
    'Could not load skipped weigh-ins',
  );
  const persistSkipped = usePersist(reloadSkipped);
  const ready = entriesReady && skippedReady;
  const reload = useCallback(
    () => Promise.all([reloadEntries(), reloadSkipped()]),
    [reloadEntries, reloadSkipped],
  );

  const isWeighInSkipped = useCallback(
    (day: string) => skippedDays.includes(day),
    [skippedDays],
  );

  const setWeighInSkipped = useCallback(
    (day: string, skipped: boolean) => {
      setSkippedDays((prev) => {
        const rest = prev.filter((d) => d !== day);
        return skipped ? [...rest, day] : rest;
      });
      persistSkipped(weight.setSkipped(day, skipped), {
        log: 'Could not save skipped weigh-in',
        toast: "Couldn't save that change — please try again.",
      });
    },
    [weight, persistSkipped],
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
      // A day with a weigh-in on it isn't skipped any more.
      const day = dayKey(new Date(loggedAt));
      if (skippedDays.includes(day)) setWeighInSkipped(day, false);
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
    [weight, change, skippedDays, setWeighInSkipped],
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
      isWeighInSkipped,
      setWeighInSkipped,
    }),
    [
      weightEntries,
      weightTrend,
      ready,
      reload,
      addWeightEntry,
      updateWeightEntry,
      isWeighInSkipped,
      setWeighInSkipped,
    ],
  );

  return (
    <WeightContext.Provider value={value}>{children}</WeightContext.Provider>
  );
}
