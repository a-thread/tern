import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { useAward } from '../waypoints/hooks/useAward';
import { allMealsLogged } from './models/meals';
import { newId } from '@shared/utils/id';
import { Meal, type FoodEntry, type NewFoodEntry } from './models/foodEntry';
import type { FoodRepository } from './food.repository';
import { WaypointSource } from '../waypoints/models/waypoint';

type FoodContextValue = {
  /** The viewed day's entries; empty until `loadedDay` matches it. */
  foodLog: FoodEntry[];
  /** The day `foodLog` was loaded for; differs from the viewed day while it loads. */
  loadedDay: string | null;
  /** False until the first load finishes — don't derive "nothing logged" from an unloaded log. */
  ready: boolean;
  /** Reads everything again from storage (pull to refresh). */
  reload: () => Promise<unknown>;
  /** Entries grouped by day for `from`..`to` inclusive, for averages and "recent foods". Days with nothing logged are absent. */
  loadHistory: (
    from: string,
    to: string,
  ) => Promise<Record<string, FoodEntry[]>>;
  /** Meals marked "nothing today" by day for `from`..`to`, for the adaptive target. */
  loadSkippedHistory: (
    from: string,
    to: string,
  ) => Promise<Record<string, FoodEntry['meal'][]>>;
  /** Adds to the viewed day. Every write is ignored on a day that can't be edited (before yesterday). */
  addFoodEntry: (entry: NewFoodEntry) => void;
  /** Adds several entries at once (e.g. a saved meal) as a single update. */
  addFoodEntries: (entries: NewFoodEntry[]) => void;
  updateFoodEntry: (id: string, patch: Partial<NewFoodEntry>) => void;
  removeFoodEntry: (id: string) => void;
  /** One update and one write; returns what was added so it can be undone. */
  replaceFoodEntries: (ids: string[], entries: NewFoodEntry[]) => FoodEntry[];
  /** Core meals marked "nothing today" on the viewed day. Logging food to one un-marks it. */
  skippedMeals: FoodEntry['meal'][];
  /** Marks (or unmarks) a core meal as "nothing today". */
  setMealSkipped: (meal: FoodEntry['meal'], skipped: boolean) => void;
};

const NO_ENTRIES: FoodEntry[] = [];
const NO_MEALS: FoodEntry['meal'][] = [];

const [FoodContext, useFood] = createRequiredContext<FoodContextValue>(
  'useFood',
  'FoodProvider',
);
export { useFood };

/** Optimistic edits; a failed write reloads the log so nothing unsaved stays on screen. */
export function FoodProvider({
  repo: food,
  children,
}: {
  repo: FoodRepository;
  children: React.ReactNode;
}) {
  const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
  const [skippedMeals, setSkippedMeals] = useState<FoodEntry['meal'][]>([]);
  const { day, editable } = useViewedDay();
  const [loadedDay, setLoadedDay] = useState<string | null>(null);

  const { ready, reload } = useLoader(
    useCallback(async () => {
      const [entries, skipped] = await Promise.all([
        food.load(day),
        food.loadSkipped(day),
      ]);
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

  const loadHistory = useCallback(
    (from: string, to: string) => food.history(from, to),
    [food],
  );
  const loadSkippedHistory = useCallback(
    (from: string, to: string) => food.skippedHistory(from, to),
    [food],
  );

  const addFoodEntry = useCallback(
    (entry: NewFoodEntry) => {
      if (!editable) return;
      const full: FoodEntry = { ...entry, id: newId() };
      setFoodLog((prev) => [...prev, full]);
      persist(food.add(day, full));
    },
    [food, day, editable, persist],
  );

  const addFoodEntries = useCallback(
    (entries: NewFoodEntry[]) => {
      if (!entries.length || !editable) return;
      const full: FoodEntry[] = entries.map((e) => ({ ...e, id: newId() }));
      setFoodLog((prev) => [...prev, ...full]);
      persist(
        Promise.all(full.map((f) => food.add(day, f))).then(() => undefined),
      );
    },
    [food, day, editable, persist],
  );

  const updateFoodEntry = useCallback(
    (id: string, patch: Partial<NewFoodEntry>) => {
      if (!editable) return;
      setFoodLog((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      );
      persist(food.update(id, patch));
    },
    [food, editable, persist],
  );

  const replaceFoodEntries = useCallback(
    (ids: string[], entries: NewFoodEntry[]): FoodEntry[] => {
      if (!editable || (!ids.length && !entries.length)) return [];
      const gone = new Set(ids);
      const full: FoodEntry[] = entries.map((e) => ({ ...e, id: newId() }));
      setFoodLog((prev) => [...prev.filter((f) => !gone.has(f.id)), ...full]);
      persist(
        Promise.all([
          ...ids.map((id) => food.remove(id)),
          ...full.map((f) => food.add(day, f)),
        ]).then(() => undefined),
      );
      return full;
    },
    [food, day, editable, persist],
  );

  const removeFoodEntry = useCallback(
    (id: string) => {
      if (!editable) return;
      setFoodLog((prev) => prev.filter((f) => f.id !== id));
      persist(food.remove(id));
    },
    [food, editable, persist],
  );

  const setMealSkipped = useCallback(
    (meal: FoodEntry['meal'], skipped: boolean) => {
      if (!editable) return;
      setSkippedMeals((prev) => {
        const rest = prev.filter((m) => m !== meal);
        return skipped ? [...rest, meal] : rest;
      });
      persist(food.setSkipped(day, meal, skipped));
    },
    [food, day, editable, persist],
  );

  // Meal awards follow the loaded day's log (today or yesterday). Waiting for the load keeps
  // an empty, unloaded log from taking them back.
  const loaded = ready && loadedDay === day && editable;
  const award = { day };
  useAward(
    WaypointSource.Meals,
    allMealsLogged(foodLog, skippedMeals),
    loaded,
    award,
  );

  // Per-meal awards need food; "nothing today" only counts toward all meals.
  useAward(
    WaypointSource.Breakfast,
    foodLog.some((f) => f.meal === Meal.Breakfast),
    loaded,
    award,
  );
  useAward(
    WaypointSource.Lunch,
    foodLog.some((f) => f.meal === Meal.Lunch),
    loaded,
    award,
  );
  useAward(
    WaypointSource.Dinner,
    foodLog.some((f) => f.meal === Meal.Dinner),
    loaded,
    award,
  );

  // A meal with food in it isn't skipped, however the food got there.
  useEffect(() => {
    for (const meal of skippedMeals) {
      if (foodLog.some((f) => f.meal === meal)) setMealSkipped(meal, false);
    }
  }, [foodLog, skippedMeals, setMealSkipped]);

  // Another day's log stays out of sight while the viewed one loads.
  const current = loadedDay === day;
  const value = useMemo<FoodContextValue>(
    () => ({
      foodLog: current ? foodLog : NO_ENTRIES,
      loadedDay,
      ready,
      reload,
      loadHistory,
      loadSkippedHistory,
      addFoodEntry,
      addFoodEntries,
      updateFoodEntry,
      removeFoodEntry,
      replaceFoodEntries,
      skippedMeals: current ? skippedMeals : NO_MEALS,
      setMealSkipped,
    }),
    [
      current,
      foodLog,
      loadedDay,
      ready,
      reload,
      loadHistory,
      loadSkippedHistory,
      addFoodEntry,
      addFoodEntries,
      updateFoodEntry,
      removeFoodEntry,
      replaceFoodEntries,
      skippedMeals,
      setMealSkipped,
    ],
  );

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}
