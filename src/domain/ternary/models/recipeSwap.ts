import type { Tier } from '../../food/models/foodEntry';
import { parseMeasure } from '../../food/models/measure';
import {
  type SavedMealItem,
  SavedMealLimits,
} from '../../saved-meals/models/savedMeals';
import type { Dish } from './ternary';

const finite = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n);
const nonNegative = (n: unknown) => (finite(n) && n >= 0 ? n : 0);

/**
 * A shared recipe's foods as they arrive from a friend's phone, made safe to save as your own
 * meal: anything malformed is dropped, and an empty or unusable recipe is undefined.
 */
export function cleanSharedItems(raw: unknown): SavedMealItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .slice(0, SavedMealLimits.MAX_ITEMS)
    .flatMap((r): SavedMealItem[] => {
      if (!r || typeof r !== 'object') return [];
      const i = r as Record<string, unknown>;
      const name = typeof i.name === 'string' ? i.name.trim() : '';
      if (!name || !finite(i.servings) || i.servings <= 0) return [];
      const tier = [1, 2, 3, 4].includes(i.tier as number)
        ? (i.tier as Tier)
        : 3;
      return [
        {
          name,
          ...(typeof i.brand === 'string' && i.brand ? { brand: i.brand } : {}),
          servings: i.servings,
          servingLabel:
            typeof i.servingLabel === 'string' ? i.servingLabel : '1 serving',
          calories: nonNegative(i.calories),
          protein: nonNegative(i.protein),
          carbs: nonNegative(i.carbs),
          fat: nonNegative(i.fat),
          tier,
          measure: parseMeasure(i.measure),
          ...(i.batch === true ? { batch: true } : {}),
        },
      ];
    });
  return items.length ? items : undefined;
}

/**
 * A friend's recipe you kept from the recipe swap: its name, its foods and who shared it.
 * Saving it to your meals is separate (`saveSharedMeal`); this is only the list. Kept on your
 * side, so it stays if the friend leaves or you do.
 */
export type KeptRecipe = {
  /** The dish it was kept from. */
  id: string;
  name: string;
  foods: string[];
  fromName: string;
};

/** Keeps a dish, newest first; keeping one already kept changes nothing. */
export function keepRecipe(
  kept: readonly KeptRecipe[],
  dish: Dish,
): KeptRecipe[] {
  if (kept.some((k) => k.id === dish.id)) return [...kept];
  return [
    {
      id: dish.id,
      name: dish.name,
      foods: [...dish.foods],
      fromName: dish.fromName,
    },
    ...kept,
  ];
}

export const unkeepRecipe = (kept: readonly KeptRecipe[], id: string) =>
  kept.filter((k) => k.id !== id);

export const isKept = (kept: readonly KeptRecipe[], id: string) =>
  kept.some((k) => k.id === id);
