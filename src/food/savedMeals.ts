import { dayTotals, type FoodEntry } from './models';
import type { NewFoodEntry } from './repository';

/** One food in a saved meal: a log entry without its id or which meal it was in. */
export type SavedMealItem = Omit<FoodEntry, 'id' | 'meal'>;

export type SavedMeal = {
  id: string;
  name: string;
  items: SavedMealItem[];
  createdAt: string;
};

export const MAX_MEAL_NAME = 60;
export const MAX_MEAL_ITEMS = 50;

/** A name as it will be stored: trimmed, with inner runs of spaces collapsed. */
export const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ');

/** Whether two names are the same meal (case and extra spaces don't matter). */
export const sameName = (a: string, b: string) =>
  cleanName(a).toLowerCase() === cleanName(b).toLowerCase();

/** A message for the user, or null when the name is fine. */
export function validateMealName(name: string): string | null {
  const n = cleanName(name);
  if (!n) return 'Give the meal a name.';
  if (n.length > MAX_MEAL_NAME) return `Keep the name under ${MAX_MEAL_NAME} characters.`;
  return null;
}

/** The items to store for these log entries: portions and food type kept, ids and meal dropped. */
export function snapshotItems(entries: FoodEntry[]): SavedMealItem[] {
  return entries.slice(0, MAX_MEAL_ITEMS).map((e) => ({
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
  }));
}

/** New log entries for a saved meal's items, all in `meal`. */
export function itemsToEntries(
  items: SavedMealItem[],
  meal: FoodEntry['meal'],
): NewFoodEntry[] {
  return items.map((i) => ({ ...i, meal }));
}

/** Calories and macros for a saved meal's items. */
export const savedMealTotals = (items: SavedMealItem[]) => dayTotals(items);

export const findMealByName = (meals: SavedMeal[], name: string) =>
  meals.find((m) => sameName(m.name, name));

export const sortMeals = (meals: SavedMeal[]) =>
  [...meals].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

/** Meals whose name contains every word of `query`; all of them when the query is blank. */
export function filterMeals(meals: SavedMeal[], query: string): SavedMeal[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return meals;
  return meals.filter((m) => {
    const name = m.name.toLowerCase();
    return words.every((w) => name.includes(w));
  });
}
