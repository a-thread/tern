import { type FoodEntry, Meal } from './foodEntry';

export class Meals {
  /** The meals that count toward the "logging all meals" rule. */
  static readonly CORE: FoodEntry['meal'][] = [
    Meal.Breakfast,
    Meal.Lunch,
    Meal.Dinner,
  ];

  static readonly ALL: FoodEntry['meal'][] = [
    Meal.Breakfast,
    Meal.Lunch,
    Meal.Dinner,
    Meal.Snack,
  ];

  static readonly OPTIONS: { key: FoodEntry['meal']; label: string }[] = [
    { key: Meal.Breakfast, label: 'Breakfast' },
    { key: Meal.Lunch, label: 'Lunch' },
    { key: Meal.Dinner, label: 'Dinner' },
    { key: Meal.Snack, label: 'Snacks' },
  ];
}

/** Logged, or marked "nothing today": a skipped meal counts exactly like a logged one. */
export function mealDone(
  meal: FoodEntry['meal'],
  log: FoodEntry[],
  skipped: readonly FoodEntry['meal'][] = [],
): boolean {
  return skipped.includes(meal) || log.some((f) => f.meal === meal);
}

export function allMealsLogged(
  log: FoodEntry[],
  skipped: readonly FoodEntry['meal'][] = [],
): boolean {
  return Meals.CORE.every((meal) => mealDone(meal, log, skipped));
}

export function mealTotals(log: FoodEntry[], meal: FoodEntry['meal']) {
  return log
    .filter((f) => f.meal === meal)
    .reduce((sum, f) => sum + f.calories * f.servings, 0);
}
