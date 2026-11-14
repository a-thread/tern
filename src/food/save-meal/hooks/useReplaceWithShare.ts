import { useCallback } from 'react';

import { useFood } from '@/domain/food/FoodContext';
import type { FoodEntry } from '@/domain/food/models/foodEntry';
import {
  recipeEntry,
  type SavedMeal,
} from '@/domain/saved-meals/models/savedMeals';

/**
 * Once a whole pot is saved as a recipe, today's log should hold what was eaten, not the pot:
 * swaps `entries` (the batch's ingredients) for `eaten` servings of the recipe in their meal,
 * in one write. Returns an undo that puts the ingredients back, or null when nothing changed.
 */
export function useReplaceWithShare() {
  const { replaceFoodEntries } = useFood();
  return useCallback(
    (
      entries: FoodEntry[],
      recipe: SavedMeal,
      eaten: number,
    ): (() => void) | null => {
      if (!entries.length) return null;
      const added = replaceFoodEntries(
        entries.map((e) => e.id),
        [recipeEntry(recipe, Math.min(eaten, recipe.servings), entries[0].meal)],
      );
      if (!added.length) return null;
      const originals = entries.map(({ id: _id, ...e }) => e);
      return () =>
        replaceFoodEntries(
          added.map((e) => e.id),
          originals,
        );
    },
    [replaceFoodEntries],
  );
}
