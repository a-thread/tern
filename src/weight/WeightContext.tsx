import React, { useCallback, useMemo, useState } from 'react';
import type { WeightRepository } from '@weight/data/weight.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { newId } from '@shared/utils/id';
import { computeTrend } from '@weight/models/weightTrend';
import type { WeightEntry } from '@weight/models/weightEntry';

type WeightContextValue = {
  /** Newest first. */
  weightEntries: WeightEntry[];
  /** Smoothed trend, oldest to newest. Empty until something is logged. */
  weightTrend: number[];
  ready: boolean;
  addWeightEntry: (lb: number) => void;
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

  const addWeightEntry = useCallback(
    (lb: number) => {
      const entry: WeightEntry = {
        id: newId(),
        lb,
        loggedAt: new Date().toISOString(),
      };
      setWeightEntries((prev) => [entry, ...prev]);
      persist(weight.add(entry), {
        log: 'Could not save weight entry',
        toast: "Couldn't save that weigh-in — please try again.",
      });
    },
    [weight, persist],
  );

  const weightTrend = useMemo(() => computeTrend(weightEntries), [weightEntries]);

  const value = useMemo<WeightContextValue>(
    () => ({ weightEntries, weightTrend, ready, addWeightEntry }),
    [weightEntries, weightTrend, ready, addWeightEntry],
  );

  return (
    <WeightContext.Provider value={value}>{children}</WeightContext.Provider>
  );
}
