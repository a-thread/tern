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
  addItem,
  draftFromMeal,
  emptyDraft,
  removeItemAt,
  stepItemServings,
  validateDraft,
  type MealDraft,
} from './mealDraft';
import {
  cleanName,
  findMealByName,
  snapshotItems,
  sortMeals,
  validateMealName,
  type SavedMeal,
  type SavedMealItem,
} from './savedMeals';

type SaveOutcome =
  | { ok: true; replaced: boolean; meal: SavedMeal }
  | { ok: false; error: string };

type CommitOutcome =
  | { ok: true; meal: SavedMeal; created: boolean }
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

  /** The meal being built or edited, or null when none is open. */
  draft: MealDraft | null;
  /** Opens a draft: a copy of an existing meal, or an empty new one. */
  startDraft: (mealId?: string) => void;
  setDraftName: (name: string) => void;
  addDraftItem: (item: SavedMealItem) => void;
  stepDraftItem: (index: number, delta: number) => void;
  removeDraftItem: (index: number) => void;
  discardDraft: () => void;
  /** Saves the draft (creating or updating the meal) and closes it. */
  commitDraft: () => CommitOutcome;
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
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const draftRef = useRef<MealDraft | null>(null);
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

  // Drafts. The ref is updated straight away so a food picked and a screen
  // change in the same moment see each other's result.
  const changeDraft = useCallback((next: MealDraft | null) => {
    draftRef.current = next;
    setDraft(next);
  }, []);

  const startDraft = useCallback(
    (mealId?: string) => {
      const meal = mealId ? latest.current.find((m) => m.id === mealId) : undefined;
      changeDraft(meal ? draftFromMeal(meal) : emptyDraft());
    },
    [changeDraft],
  );

  const setDraftName = useCallback(
    (name: string) => {
      if (draftRef.current) changeDraft({ ...draftRef.current, name });
    },
    [changeDraft],
  );

  const addDraftItem = useCallback(
    (item: SavedMealItem) => {
      const d = draftRef.current ?? emptyDraft();
      changeDraft({ ...d, items: addItem(d.items, item) });
    },
    [changeDraft],
  );

  const stepDraftItem = useCallback(
    (index: number, delta: number) => {
      const d = draftRef.current;
      if (d) changeDraft({ ...d, items: stepItemServings(d.items, index, delta) });
    },
    [changeDraft],
  );

  const removeDraftItem = useCallback(
    (index: number) => {
      const d = draftRef.current;
      if (d) changeDraft({ ...d, items: removeItemAt(d.items, index) });
    },
    [changeDraft],
  );

  const discardDraft = useCallback(() => changeDraft(null), [changeDraft]);

  const commitDraft = useCallback((): CommitOutcome => {
    const d = draftRef.current;
    if (!d) return { ok: false, error: 'There is no meal open.' };
    const problem = validateDraft(d, latest.current);
    if (problem) return { ok: false, error: problem };

    const clean = cleanName(d.name);
    const existing = d.id ? latest.current.find((m) => m.id === d.id) : undefined;
    const meal: SavedMeal = existing
      ? { ...existing, name: clean, items: d.items }
      : { id: d.id ?? newId(), name: clean, items: d.items, createdAt: new Date().toISOString() };

    commit(
      sortMeals(
        existing
          ? latest.current.map((m) => (m.id === meal.id ? meal : m))
          : [...latest.current, meal],
      ),
    );
    persist(repo.save(meal));
    changeDraft(null);
    return { ok: true, meal, created: !existing };
  }, [repo, persist, commit, changeDraft]);

  const value = useMemo<SavedMealsContextValue>(
    () => ({
      meals,
      ready,
      saveMeal,
      renameMeal,
      deleteMeal,
      draft,
      startDraft,
      setDraftName,
      addDraftItem,
      stepDraftItem,
      removeDraftItem,
      discardDraft,
      commitDraft,
    }),
    [
      meals,
      ready,
      saveMeal,
      renameMeal,
      deleteMeal,
      draft,
      startDraft,
      setDraftName,
      addDraftItem,
      stepDraftItem,
      removeDraftItem,
      discardDraft,
      commitDraft,
    ],
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

