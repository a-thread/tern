import { cleanSpaces, sameName } from '@shared/utils/text';
import {
  dayTotals,
  type FoodEntry,
  type NewFoodEntry,
  type Tier,
} from '../../food/models/foodEntry';
import { Servings } from '../../food/models/servings';
import { amountOf, scaleMeasure } from '../../food/models/measure';

/** One food in a saved meal: a log entry without its id or which meal it was in. */
export type SavedMealItem = Omit<FoodEntry, 'id' | 'meal'>;

export type SavedMeal = {
  id: string;
  name: string;
  items: SavedMealItem[];
  /** How many servings the items make together; more than 1 makes it a recipe. */
  servings: number;
  createdAt: string;
};

/** How long a saved meal's name can be, and how many foods it can hold. */
export class SavedMealLimits {
  static readonly MAX_NAME_LENGTH = 60;

  static readonly MAX_ITEMS = 50;

  /** How many servings a meal can make; a meal of 1 is not a recipe. */
  static readonly MIN_SERVINGS = 1;

  static readonly MAX_SERVINGS = 100;
}

/** A whole number of servings within limits; 1 for anything that is not a number. */
export function cleanServings(n: unknown): number {
  const v = typeof n === 'number' ? Math.round(n) : NaN;
  if (!Number.isFinite(v)) return SavedMealLimits.MIN_SERVINGS;
  return Math.min(
    Math.max(v, SavedMealLimits.MIN_SERVINGS),
    SavedMealLimits.MAX_SERVINGS,
  );
}

/** Servings typed for a recipe's yield ("8", "12 "): a whole number in range, or null while it is not one. */
export function typedYield(text: string): number | null {
  const n = parseInt(text.trim(), 10);
  return Number.isFinite(n) && n >= SavedMealLimits.MIN_SERVINGS
    ? cleanServings(n)
    : null;
}

/** Servings eaten typed in ("1.5", "1,5"), to the nearest quarter and within limits; null while it is not a number. */
export function typedEaten(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(
    Math.max(Math.round(n * 4) / 4, Servings.MIN),
    SavedMealLimits.MAX_SERVINGS,
  );
}

/** A recipe is a saved meal that makes more than one serving. */
export const isRecipe = (meal: Pick<SavedMeal, 'servings'>) =>
  meal.servings > 1;

/** A name as it will be stored: trimmed, with inner runs of spaces collapsed. */
export const cleanName = cleanSpaces;

/** A message for the user, or null when the name is fine. */
export function validateMealName(name: string): string | null {
  const n = cleanName(name);
  if (!n) return 'Give the meal a name.';
  if (n.length > SavedMealLimits.MAX_NAME_LENGTH)
    return `Keep the name under ${SavedMealLimits.MAX_NAME_LENGTH} characters.`;
  return null;
}

/** The items to store for these log entries: portions and food type kept, ids and meal dropped. */
export function snapshotItems(entries: FoodEntry[]): SavedMealItem[] {
  return entries.slice(0, SavedMealLimits.MAX_ITEMS).map((e) => ({
    name: e.name,
    brand: e.brand,
    servings: e.servings,
    servingLabel: e.servingLabel,
    calories: e.calories,
    protein: e.protein,
    carbs: e.carbs,
    fat: e.fat,
    tier: e.tier,
    tierOverridden: e.tierOverridden,
    measure: e.measure,
  }));
}

/** Servings after scaling a whole meal, to two decimals (so 0.5 × 0.75 stays tidy). */
export const scaleServings = (servings: number, factor: number) =>
  Math.round(servings * factor * 100) / 100;

/**
 * New log entries for a saved meal's items, all in `meal`. `scale` multiplies
 * every item's servings (0.5 = half portions), leaving the saved meal alone.
 */
export function itemsToEntries(
  items: SavedMealItem[],
  meal: FoodEntry['meal'],
  scale = 1,
): NewFoodEntry[] {
  return items.map((i) => ({
    ...i,
    meal,
    // Measured items scale their amount (half the eggs); others scale their servings.
    ...(i.measure && scale !== 1
      ? amountOf(scaleMeasure(i.measure, scale))
      : { servings: scaleServings(i.servings, scale) }),
  }));
}

/** Calories and macros for a saved meal's items. */
export const savedMealTotals = (items: SavedMealItem[]) => dayTotals(items);

/** The tier covering the most calories among the items; a tie goes to the higher tier. */
export function dominantTier(items: SavedMealItem[]): Tier {
  const calories = new Map<Tier, number>();
  for (const i of items)
    calories.set(i.tier, (calories.get(i.tier) ?? 0) + i.calories * i.servings);
  let best: Tier = items[0]?.tier ?? 1;
  let most = -1;
  for (const [tier, cal] of calories) {
    if (cal > most || (cal === most && tier > best)) {
      best = tier;
      most = cal;
    }
  }
  return best;
}

/**
 * The one log entry for eating `eaten` servings of a recipe. Macros are per serving, so the
 * entry scales like any food ("1.5 × 1 serving").
 */
export function recipeEntry(
  meal: Pick<SavedMeal, 'name' | 'items' | 'servings'>,
  eaten: number,
  logMeal: FoodEntry['meal'],
): NewFoodEntry {
  const total = savedMealTotals(meal.items);
  const per = (v: number) => Math.round((v / meal.servings) * 10) / 10;
  return {
    name: meal.name,
    meal: logMeal,
    servings: eaten,
    servingLabel: '1 serving',
    calories: Math.round(total.calories / meal.servings),
    protein: per(total.protein),
    carbs: per(total.carbs),
    fat: per(total.fat),
    tier: dominantTier(meal.items),
    tierOverridden: false,
  };
}

export const findMealByName = (meals: SavedMeal[], name: string) =>
  meals.find((m) => sameName(m.name, name));

export const sortMeals = (meals: SavedMeal[]) =>
  [...meals].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

/** Meals whose name contains every word of `query`; all of them when the query is blank. */
export function filterMeals(meals: SavedMeal[], query: string): SavedMeal[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return meals;
  return meals.filter((m) => {
    const name = m.name.toLowerCase();
    return words.every((w) => name.includes(w));
  });
}
