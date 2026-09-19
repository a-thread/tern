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
import { dayKey } from '@shared/utils/date';
import { newId } from '@shared/utils/id';
import type { FoodEntry } from './models';
import type { NewFoodEntry } from './repository';

type FoodContextValue = {
  /** Today's entries. */
  foodLog: FoodEntry[];
  /** False until the first load finishes — don't derive "nothing logged" from an unloaded log. */
  ready: boolean;
  addFoodEntry: (entry: NewFoodEntry) => void;
  updateFoodEntry: (id: string, patch: Partial<NewFoodEntry>) => void;
  removeFoodEntry: (id: string) => void;
};

const FoodContext = createContext<FoodContextValue | null>(null);

/**
 * Edits apply to the screen immediately and are persisted in the
 * background; if a write fails, the log is reloaded from the repository so
 * the screen never keeps showing something that wasn't saved.
 */
export function FoodProvider({ children }: { children: React.ReactNode }) {
  const { food } = useBackend();
  const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
  const [ready, setReady] = useState(false);
  const day = useRef(dayKey()).current;
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    try {
      const entries = await food.load(day);
      if (mounted.current) setFoodLog(entries);
    } catch (e) {
      console.warn('Could not load food log', e);
    }
  }, [food, day]);

  useEffect(() => {
    mounted.current = true;
    reload().finally(() => mounted.current && setReady(true));
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const persist = useCallback(
    (write: Promise<void>) => {
      write.catch((e) => {
        console.warn('Could not save food change', e);
        reload();
      });
    },
    [reload],
  );

  const addFoodEntry = useCallback(
    (entry: NewFoodEntry) => {
      const full: FoodEntry = { ...entry, id: newId() };
      setFoodLog((prev) => [...prev, full]);
      persist(food.add(day, full));
    },
    [food, day, persist],
  );

  const updateFoodEntry = useCallback(
    (id: string, patch: Partial<NewFoodEntry>) => {
      setFoodLog((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      );
      persist(food.update(id, patch));
    },
    [food, persist],
  );

  const removeFoodEntry = useCallback(
    (id: string) => {
      setFoodLog((prev) => prev.filter((f) => f.id !== id));
      persist(food.remove(id));
    },
    [food, persist],
  );

  const value = useMemo<FoodContextValue>(
    () => ({ foodLog, ready, addFoodEntry, updateFoodEntry, removeFoodEntry }),
    [foodLog, ready, addFoodEntry, updateFoodEntry, removeFoodEntry],
  );

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood() {
  const ctx = useContext(FoodContext);
  if (!ctx) throw new Error('useFood must be used within FoodProvider');
  return ctx;
}
