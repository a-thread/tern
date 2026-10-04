import type { FoodEntry } from './foodEntry';
import { Meal } from './foodEntry';

/** The meals of a day: which count toward the logging rule, and how they are listed. */
export class Meals {
  /** The meals that count toward the "logging all meals" waypoint rule. */
  static readonly CORE: FoodEntry['meal'][] = [Meal.Breakfast, Meal.Lunch, Meal.Dinner];

  /** Every meal in the order a day runs, snacks last. */
  static readonly ALL: FoodEntry['meal'][] = [Meal.Breakfast, Meal.Lunch, Meal.Dinner, Meal.Snack];

  /**
  * Meals selectable when logging or reassigning a food entry, in the order the
  * Food tab shows them. Snacks are optional: they never count toward (or
  * against) the "logging all meals" rule.
  */
  static readonly OPTIONS: { key: FoodEntry['meal']; label: string }[] = [
    { key: Meal.Breakfast, label: 'Breakfast' },
    { key: Meal.Lunch, label: 'Lunch' },
    { key: Meal.Dinner, label: 'Dinner' },
    { key: Meal.Snack, label: 'Snacks' },
  ];
}

/**
 * Single source of truth for "every core meal is accounted for": it has an
 * entry, or was marked as "nothing today". Feeds both the waypoints bonus and
 * any UI that shows meal-logging progress. A skipped meal counts exactly like
 * a logged one, so the rule rewards a complete log, never skipping or eating more.
 */
export function allMealsLogged(
  log: FoodEntry[],
  skipped: readonly FoodEntry['meal'][] = [],
): boolean {
  return Meals.CORE.every(
    (meal) => skipped.includes(meal) || log.some((f) => f.meal === meal),
  );
}

export function mealTotals(log: FoodEntry[], meal: FoodEntry['meal']) {
  return log
    .filter((f) => f.meal === meal)
    .reduce((sum, f) => sum + f.calories * f.servings, 0);
}