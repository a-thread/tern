import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useBackend } from '@shared/state/BackendContext';
import { newId } from '@shared/utils/id';
import { computeTrend, type WeightEntry } from './models';

type WeightContextValue = {
  /** Newest first. */
  weightEntries: WeightEntry[];
  /** Smoothed trend, oldest to newest. Empty until something is logged. */
  weightTrend: number[];
  ready: boolean;
  addWeightEntry: (kg: number) => void;
};

const WeightContext = createContext<WeightContextValue | null>(null);

export function WeightProvider({ children }: { children: React.ReactNode }) {
  const { weight } = useBackend();
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    try {
      const entries = await weight.load();
      if (mounted.current) setWeightEntries(entries);
    } catch (e) {
      console.warn('Could not load weight entries', e);
    }
  }, [weight]);

  useEffect(() => {
    mounted.current = true;
    reload().finally(() => mounted.current && setReady(true));
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const addWeightEntry = useCallback(
    (kg: number) => {
      const entry: WeightEntry = {
        id: newId(),
        kg,
        loggedAt: new Date().toISOString(),
      };
      setWeightEntries((prev) => [entry, ...prev]);
      weight.add(entry).catch((e) => {
        console.warn('Could not save weight entry', e);
        reload();
      });
    },
    [weight, reload],
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

export function useWeight() {
  const ctx = useContext(WeightContext);
  if (!ctx) throw new Error('useWeight must be used within WeightProvider');
  return ctx;
}
