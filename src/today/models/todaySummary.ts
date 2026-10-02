import type { FoodEntry } from '@food/models/foodEntry';
import { Meals } from '@food/models/meals';
import { isLoggedToday, type WeightEntry } from '@weight/models/weightEntry';

export type TodaySummary = {
  /** The meals logged today (in day order) and their calories; null when nothing is logged. */
  meals: { names: FoodEntry['meal'][]; calories: number } | null;
  /** Today's weigh-in, if there is one. */
  weighedIn: WeightEntry | null;
  /** Names of the medications taken today. */
  medications: string[];
  stepGoalReached: boolean;
  /** Ounces of water today; null when none was logged (or water isn't tracked). */
  waterOz: number | null;
  /** Today's mood and stress check-in, if there is one. */
  checkIn: { mood: number; stress: number } | null;
};

/** What has been done today, for the card that replaces "left to do" once it's empty. */
export function todaySummary(
  foodLog: FoodEntry[],
  lastWeight: WeightEntry | undefined,
  takenMedicationNames: string[],
  stepGoalReached: boolean,
  now: Date = new Date(),
  waterOz = 0,
  checkIn: { mood: number; stress: number } | null = null,
): TodaySummary {
  const names = Meals.ALL.filter((m) => foodLog.some((f) => f.meal === m));
  const calories = foodLog.reduce((sum, f) => sum + f.calories * f.servings, 0);
  return {
    meals: names.length ? { names, calories: Math.round(calories) } : null,
    weighedIn: lastWeight && isLoggedToday(lastWeight.loggedAt, now) ? lastWeight : null,
    medications: takenMedicationNames,
    stepGoalReached,
    waterOz: waterOz > 0 ? waterOz : null,
    checkIn,
  };
}