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
import { useToast } from '@shared/state/ToastContext';
import { newId } from '@shared/utils/id';
import type { FoodEntry } from './models';
import {
  cleanName,
  findMealByName,
  snapshotItems,
  sortMeals,
  validateMealName,
  type SavedMeal,
} from './savedMeals';

type SaveOutcome =
  | { ok: true; replaced: boolean; meal: SavedMeal }
  | { ok: false; error: string };

type SavedMealsContextValue = {
  /** Sorted by name. */
  meals: SavedMeal[];
  ready: boolean;
  /**
   * Saves `entries` as a meal called `name`. A meal that already has that name
   * (ignoring case) is replaced, keeping its id; callers should confirm first.
   */
  saveMeal: (name: string, entries: FoodEntry[]) => SaveOutcome;
  /** Returns an error message, or null on success. */
  renameMeal: (id: string, name: string) => string | null;
  deleteMeal: (id: string) => void;
};

const SavedMealsContext = createContext<SavedMealsContextValue | null>(null);

/**
 * Edits apply to the screen immediately and are saved in the background; if a
 * write fails, the list is reloaded so it never shows something that wasn't saved.
 */
export function SavedMealsProvider({ children }: { children: React.ReactNode }) {
  const { savedMeals: repo } = useBackend();
  const toast = useToast();
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);
  // The latest list, so saveMeal/renameMeal can decide synchronously.
  const latest = useRef<SavedMeal[]>([]);
  latest.current = meals;

  // Updates the ref straight away (not just on the next render) so two edits
  // in the same moment each see the other's result.
  const commit = useCallback((next: SavedMeal[]) => {
    latest.current = next;
    setMeals(next);
  }, []);

  const reload = useCallback(async () => {
    try {
      const list = await repo.list();
      if (mounted.current) commit(sortMeals(list));
    } catch (e) {
      console.warn('Could not load saved meals', e);
    }
  }, [repo, commit]);

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
        console.warn('Could not save meal change', e);
        toast.show("Couldn't save that meal — your list was refreshed.");
        reload();
      });
    },
    [reload, toast],
  );

  const saveMeal = useCallback(
    (name: string, entries: FoodEntry[]): SaveOutcome => {
      const problem = validateMealName(name);
      if (problem) return { ok: false, error: problem };
      if (!entries.length) return { ok: false, error: 'Add some foods to this meal first.' };

      const clean = cleanName(name);
      const items = snapshotItems(entries);
      const existing = findMealByName(latest.current, clean);
      const meal: SavedMeal = existing
        ? { ...existing, name: clean, items }
        : { id: newId(), name: clean, items, createdAt: new Date().toISOString() };

      commit(
        sortMeals(
          existing
            ? latest.current.map((m) => (m.id === meal.id ? meal : m))
            : [...latest.current, meal],
        ),
      );
      persist(repo.save(meal));
      return { ok: true, replaced: Boolean(existing), meal };
    },
    [repo, persist, commit],
  );

  const renameMeal = useCallback(
    (id: string, name: string): string | null => {
      const problem = validateMealName(name);
      if (problem) return problem;
      const clean = cleanName(name);
      const meal = latest.current.find((m) => m.id === id);
      if (!meal) return 'That meal no longer exists.';
      const clash = findMealByName(latest.current, clean);
      if (clash && clash.id !== id) return `You already have a meal called “${clash.name}”.`;
      if (meal.name === clean) return null;

      const renamed = { ...meal, name: clean };
      commit(sortMeals(latest.current.map((m) => (m.id === id ? renamed : m))));
      persist(repo.save(renamed));
      return null;
    },
    [repo, persist, commit],
  );

  const deleteMeal = useCallback(
    (id: string) => {
      commit(latest.current.filter((m) => m.id !== id));
      persist(repo.remove(id));
    },
    [repo, persist, commit],
  );

  const value = useMemo<SavedMealsContextValue>(
    () => ({ meals, ready, saveMeal, renameMeal, deleteMeal }),
    [meals, ready, saveMeal, renameMeal, deleteMeal],
  );

  return (
    <SavedMealsContext.Provider value={value}>{children}</SavedMealsContext.Provider>
  );
}

export function useSavedMeals() {
  const ctx = useContext(SavedMealsContext);
  if (!ctx) throw new Error('useSavedMeals must be used within SavedMealsProvider');
  return ctx;
}

