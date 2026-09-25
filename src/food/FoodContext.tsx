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
import { useDayKey } from '@shared/hooks/useDayKey';
import { useToast } from '@shared/state/ToastContext';
import { newId } from '@shared/utils/id';
import type { FoodEntry } from './models';
import type { NewFoodEntry } from './repository';

type FoodContextValue = {
  /** Today's entries. */
  foodLog: FoodEntry[];
  /** The day `foodLog` was loaded for — differs from today briefly after midnight. */
  loadedDay: string | null;
  /** False until the first load finishes — don't derive "nothing logged" from an unloaded log. */
  ready: boolean;
  addFoodEntry: (entry: NewFoodEntry) => void;
  /** Adds several entries at once (e.g. a saved meal) as a single update. */
  addFoodEntries: (entries: NewFoodEntry[]) => void;
  updateFoodEntry: (id: string, patch: Partial<NewFoodEntry>) => void;
  removeFoodEntry: (id: string) => void;
  /** Core meals marked "nothing today". Logging food to one un-marks it. */
  skippedMeals: FoodEntry['meal'][];
  /** Marks (or unmarks) a core meal as "nothing today". */
  setMealSkipped: (meal: FoodEntry['meal'], skipped: boolean) => void;
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
  const [skippedMeals, setSkippedMeals] = useState<FoodEntry['meal'][]>([]);
  const [ready, setReady] = useState(false);
  const day = useDayKey();
  const toast = useToast();
  const [loadedDay, setLoadedDay] = useState<string | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    try {
      const [entries, skipped] = await Promise.all([
        food.load(day),
        food.loadSkipped(day),
      ]);
      if (mounted.current) {
        setFoodLog(entries);
        setSkippedMeals(skipped);
        setLoadedDay(day);
      }
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
        toast.show("Couldn't save that change — your log was refreshed.");
        reload();
      });
    },
    [reload, toast],
  );

  const addFoodEntry = useCallback(
    (entry: NewFoodEntry) => {
      const full: FoodEntry = { ...entry, id: newId() };
      setFoodLog((prev) => [...prev, full]);
      persist(food.add(day, full));
    },
    [food, day, persist],
  );

  const addFoodEntries = useCallback(
    (entries: NewFoodEntry[]) => {
      if (!entries.length) return;
      const full: FoodEntry[] = entries.map((e) => ({ ...e, id: newId() }));
      setFoodLog((prev) => [...prev, ...full]);
      persist(Promise.all(full.map((f) => food.add(day, f))).then(() => undefined));
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

  const setMealSkipped = useCallback(
    (meal: FoodEntry['meal'], skipped: boolean) => {
      setSkippedMeals((prev) => {
        const rest = prev.filter((m) => m !== meal);
        return skipped ? [...rest, meal] : rest;
      });
      persist(food.setSkipped(day, meal, skipped));
    },
    [food, day, persist],
  );

  // A meal with food in it isn't skipped any more, however the food got there
  // (added, moved from another meal, or a saved meal).
  useEffect(() => {
    for (const meal of skippedMeals) {
      if (foodLog.some((f) => f.meal === meal)) setMealSkipped(meal, false);
    }
  }, [foodLog, skippedMeals, setMealSkipped]);

  const value = useMemo<FoodContextValue>(
    () => ({
      foodLog,
      loadedDay,
      ready,
      addFoodEntry,
      addFoodEntries,
      updateFoodEntry,
      removeFoodEntry,
      skippedMeals,
      setMealSkipped,
    }),
    [
      foodLog,
      loadedDay,
      ready,
      addFoodEntry,
      addFoodEntries,
      updateFoodEntry,
      removeFoodEntry,
      skippedMeals,
      setMealSkipped,
    ],
  );

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood() {
  const ctx = useContext(FoodContext);
  if (!ctx) throw new Error('useFood must be used within FoodProvider');
  return ctx;
}
