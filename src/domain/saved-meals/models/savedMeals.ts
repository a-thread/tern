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
export type SavedMealItem = Omit<FoodEntry, 'id' | 'meal'> & {
  /**
   * A homemade batch typed in on New food: the one item of a recipe, standing for the whole
   * pot. Its share is logged weighed, like the serving first logged from it.
   */
  batch?: boolean;
};

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

/** A batch typed in on New food and saved as a recipe: one item standing for the whole pot. */
export class HomemadeBatch {
  /** What the item's serving is called. */
  static readonly LABEL = 'whole batch';
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

/**
 * Servings eaten typed in ("1.5", "1,5"), to the nearest quarter and no more than `max` (what
 * the recipe makes); null while it is not a number.
 */
export function typedEaten(
  text: string,
  max: number = SavedMealLimits.MAX_SERVINGS,
): number | null {
  const n = parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(Math.max(Math.round(n * 4) / 4, Servings.MIN), max);
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
  // `batch` belongs to the saved item only, never to a log entry.
  return items.map(({ batch: _batch, ...i }) => ({
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
  const base = {
    name: meal.name,
    meal: logMeal,
    tier: dominantTier(meal.items),
    tierOverridden: false,
  };
  // A homemade batch saved with a serving weight is one weighed item ("8 bowls"): its share
  // stays weighed ("1 bowl"), so it can be changed by the ounce or gram like the first one.
  // Any other recipe is logged by the serving, whatever its foods were measured in.
  const only = meal.items.length === 1 ? meal.items[0] : null;
  if (only?.batch && only.measure) {
    const share = eaten / meal.servings;
    const t = (v: number) => Math.round(v * share * 10) / 10;
    return {
      ...base,
      ...amountOf(scaleMeasure(only.measure, share)),
      // The numbers as saved, not rebuilt from per-100 g.
      calories: Math.round(total.calories * share),
      protein: t(total.protein),
      carbs: t(total.carbs),
      fat: t(total.fat),
    };
  }
  return {
    ...base,
    servings: eaten,
    servingLabel: '1 serving',
    calories: Math.round(total.calories / meal.servings),
    protein: per(total.protein),
    carbs: per(total.carbs),
    fat: per(total.fat),
  };
}

/** Why a meal can't be saved over the recipe called `name`. */
export const recipeClash = (name: string) =>
  `“${name}” is a recipe. Pick another name to save these foods as a meal.`;

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
