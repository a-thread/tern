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

export type IntakeAverage = {
  /** How many days with anything logged the averages are over. */
  days: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/**
 * Average daily intake over the days that have food logged. `today`, if given,
 * is left out when other days exist: it's still in progress, so it would drag
 * the average down. Null when there's nothing to average.
 */
export function averageIntake(
  byDay: Record<string, FoodEntry[]>,
  today?: string,
): IntakeAverage | null {
  let keys = Object.keys(byDay).filter((k) => byDay[k].length > 0);
  if (today && keys.length > 1) keys = keys.filter((k) => k !== today);
  if (!keys.length) return null;
  const sum = keys.reduce(
    (acc, k) => {
      const t = dayTotals(byDay[k]);
      return {
        calories: acc.calories + t.calories,
        protein: acc.protein + t.protein,
        carbs: acc.carbs + t.carbs,
        fat: acc.fat + t.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const n = keys.length;
  return {
    days: n,
    calories: Math.round(sum.calories / n),
    protein: Math.round(sum.protein / n),
    carbs: Math.round(sum.carbs / n),
    fat: Math.round(sum.fat / n),
  };
}

export function mealTotals(log: FoodEntry[], meal: FoodEntry['meal']) {
  return log
    .filter((f) => f.meal === meal)
    .reduce((sum, f) => sum + f.calories * f.servings, 0);
}

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
