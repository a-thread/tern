/**
 * Food domain: types, the NOVA tier scale, and the pure calculations that
 * still apply once real data replaces the mock log (see mock.ts).
 */

export type Tier = 1 | 2 | 3 | 4;

export enum Meal {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  Snack = 'snack',
}

export type FoodEntry = {
  id: string;
  name: string;
  brand?: string;
  meal: Meal;
  servings: number;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tier: Tier;
  tierOverridden?: boolean;
};

/** Anything with a per-serving nutrition and a serving count: a log entry or a saved-meal item. */
type Servable = Pick<FoodEntry, 'calories' | 'protein' | 'carbs' | 'fat' | 'servings'>;

export function dayTotals(log: Servable[]) {
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