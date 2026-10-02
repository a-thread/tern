import { dayTotals } from './foodEntry';
import type { FoodEntry } from './foodEntry';

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