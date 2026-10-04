import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { useAward } from '@journey/hooks/useAward';
import { allMealsLogged } from '@food/models/meals';
import { newId } from '@shared/utils/id';
import type { FoodEntry } from '@food/models/foodEntry';
import type { FoodRepository, NewFoodEntry } from '@food/data/food.repository';
import { WaypointSource } from '@journey/models/waypoint';

type FoodContextValue = {
  /** Today's entries. */
  foodLog: FoodEntry[];
  /** The day `foodLog` was loaded for — differs from today briefly after midnight. */
  loadedDay: string | null;
  /** False until the first load finishes — don't derive "nothing logged" from an unloaded log. */
  ready: boolean;
  /** Entries grouped by day for `from`..`to` inclusive, for averages and "recent foods". Days with nothing logged are absent. */
  loadHistory: (from: string, to: string) => Promise<Record<string, FoodEntry[]>>;
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

const [FoodContext, useFood] = createRequiredContext<FoodContextValue>('useFood', 'FoodProvider');
export { useFood };

/**
 * Edits apply to the screen immediately and are persisted in the
 * background; if a write fails, the log is reloaded from the repository so
 * the screen never keeps showing something that wasn't saved.
 */
export function FoodProvider({
  repo: food,
  children,
}: {
  repo: FoodRepository;
  children: React.ReactNode;
}) {
  const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
  const [skippedMeals, setSkippedMeals] = useState<FoodEntry['meal'][]>([]);
  const day = useDayKey();
  const [loadedDay, setLoadedDay] = useState<string | null>(null);

  const { ready, reload } = useLoader(
    useCallback(async () => {
      const [entries, skipped] = await Promise.all([food.load(day), food.loadSkipped(day)]);
      return { entries, skipped };
    }, [food, day]),
    ({ entries, skipped }) => {
      setFoodLog(entries);
      setSkippedMeals(skipped);
      setLoadedDay(day);
    },
    'Could not load food log',
  );
  const persistWith = usePersist(reload);
  const persist = useCallback(
    (write: Promise<unknown>) =>
      persistWith(write, {
        log: 'Could not save food change',
        toast: "Couldn't save that change — your log was refreshed.",
      }),
    [persistWith],
  );

  const loadHistory = useCallback((from: string, to: string) => food.history(from, to), [food]);

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

  // The "logging all meals" bonus follows the log, like the water goal: earned once every core
  // meal has an entry (or is marked "nothing today"), quietly taken back if a removal or edit
  // drops coverage again. It waits for today's log, so an unloaded (empty) one is never mistaken
  // for a dropped one.
  useAward(WaypointSource.Meals, allMealsLogged(foodLog, skippedMeals), ready && loadedDay === day);

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
      loadHistory,
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
      loadHistory,
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
