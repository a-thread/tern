import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  weightEntries as initialWeightEntries,
  weightTrend as initialWeightTrend,
} from './mock';
import type { WeightEntry } from './models';

type WeightContextValue = {
  weightEntries: WeightEntry[];
  weightTrend: number[];
  addWeightEntry: (kg: number) => void;
};

const WeightContext = createContext<WeightContextValue | null>(null);

export function WeightProvider({ children }: { children: React.ReactNode }) {
  const [weightEntries, setWeightEntries] =
    useState<WeightEntry[]>(initialWeightEntries);
  const [weightTrend, setWeightTrend] = useState<number[]>(initialWeightTrend);

  const addWeightEntry = useCallback((kg: number) => {
    setWeightEntries((prev) => [
      { id: `w${Date.now()}`, kg, loggedAt: 'Today, just now' },
      ...prev,
    ]);
    setWeightTrend((prev) => [...prev.slice(1), kg]);
  }, []);

  const value = useMemo<WeightContextValue>(
    () => ({ weightEntries, weightTrend, addWeightEntry }),
    [weightEntries, weightTrend, addWeightEntry],
  );

  return (
    <WeightContext.Provider value={value}>{children}</WeightContext.Provider>
  );
}

export function useWeight() {
  const ctx = useContext(WeightContext);
  if (!ctx) throw new Error('useWeight must be used within WeightProvider');
  return ctx;
}
