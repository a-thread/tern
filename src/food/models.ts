/**
 * Food domain: types, the NOVA tier scale, and the pure calculations that
 * still apply once real data replaces the mock log (see mock.ts).
 */

export type Tier = 1 | 2 | 3 | 4;

export type FoodEntry = {
  id: string;
  name: string;
  brand?: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tier: Tier;
  tierOverridden?: boolean;
};

/** The meals that count toward the "logging all meals" waypoint rule. */
export const CORE_MEALS: FoodEntry['meal'][] = ['breakfast', 'lunch', 'dinner'];

/**
 * Meals selectable when logging or reassigning a food entry. Deliberately
 * excludes 'snack' — the Food tab only renders breakfast/lunch/dinner
 * sections, so a snack-tagged entry would have nowhere to appear.
 */
export const MEAL_OPTIONS: { key: FoodEntry['meal']; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

/** Single source of truth for "every core meal has at least one entry" — feeds both the waypoints bonus and any UI that shows meal-logging progress. */
export function allMealsLogged(log: FoodEntry[]): boolean {
  return CORE_MEALS.every((meal) => log.some((f) => f.meal === meal));
}

export function mealTotals(log: FoodEntry[], meal: FoodEntry['meal']) {
  return log
    .filter((f) => f.meal === meal)
    .reduce((sum, f) => sum + f.calories * f.servings, 0);
}

export function dayTotals(log: FoodEntry[]) {
  return log.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories * f.servings,
      protein: acc.protein + f.protein * f.servings,
      carbs: acc.carbs + f.carbs * f.servings,
      fat: acc.fat + f.fat * f.servings,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
