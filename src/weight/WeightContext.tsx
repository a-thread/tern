import React, { useCallback, useMemo, useState } from 'react';
import type { WeightRepository } from '@weight/data/weight.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { newId } from '@shared/utils/id';
import { computeTrend } from '@weight/models/weightTrend';
import { isLoggedToday, type WeightEntry } from '@weight/models/weightEntry';
import { useSettings } from '@settings/SettingsContext';
import { useAward } from '@journey/hooks/useAward';
import { WaypointSource } from '@journey/models/waypoint';
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
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const { ready, reload } = useLoader(
    useCallback(() => weight.load(), [weight]),
    setWeightEntries,
    'Could not load weight entries',
  );
  const persist = usePersist(reload);

  // A weigh-in earns its waypoint for being logged, whatever it says. Taken back if today's is
  // removed; nothing happens while weight tracking is off.
  const { settings } = useSettings();
  const today = useDayKey();
  const weighedToday = useMemo(
    () => weightEntries.some((e) => isLoggedToday(e.loggedAt, new Date(`${today}T12:00:00`))),
    [weightEntries, today],
  );
  useAward(WaypointSource.Weight, weighedToday, settings.trackWeight && ready);

  const addWeightEntry = useCallback(
    (lb: number, loggedAt: string = new Date().toISOString()) => {
      const entry: WeightEntry = { id: newId(), lb, loggedAt };
      // Newest first, wherever a back-dated one lands.
      setWeightEntries((prev) =>
        [entry, ...prev].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)),
      );
      persist(weight.add(entry), {
        log: 'Could not save weight entry',
        toast: "Couldn't save that weigh-in — please try again.",
      });
    },
    [weight, persist],
  );

  const updateWeightEntry = useCallback(
    (id: string, lb: number) => {
      setWeightEntries((prev) => prev.map((e) => (e.id === id ? { ...e, lb } : e)));
      persist(weight.update(id, lb), {
        log: 'Could not update weight entry',
        toast: "Couldn't save that change — please try again.",
      });
    },
    [weight, persist],
  );

  const weightTrend = useMemo(() => computeTrend(weightEntries), [weightEntries]);

  const value = useMemo<WeightContextValue>(
    () => ({ weightEntries, weightTrend, ready, reload, addWeightEntry, updateWeightEntry }),
    [weightEntries, weightTrend, ready, reload, addWeightEntry, updateWeightEntry],
  );

  return (
    <WeightContext.Provider value={value}>{children}</WeightContext.Provider>
  );
}
