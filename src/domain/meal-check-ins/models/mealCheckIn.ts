import type { Meal } from '../../food/models/foodEntry';

/**
 * How a meal sat: fullness and how you feel afterward, each 1 to 5. One per meal per local
 * day (`day` is YYYY-MM-DD); checking in on the same meal again replaces it.
 */
export type MealCheckIn = {
  day: string;
  meal: Meal;
  fullness: number;
  feeling: number;
  /** Anything else worth remembering about the meal; absent when nothing was written. */
  note?: string;
};

/** The free-text note on a meal check-in. */
export class MealCheckInNote {
  static readonly MAX_LENGTH = 280;
}

/** A note as stored: trimmed, capped, and absent when only blank space was typed. */
export function cleanNote(text: string | null | undefined): string | undefined {
  const trimmed = (text ?? '').trim().slice(0, MealCheckInNote.MAX_LENGTH);
  return trimmed ? trimmed : undefined;
}

export enum MealCheckInMetric {
  Fullness = 'fullness',
  Feeling = 'feeling',
}

/** The 1 to 5 scale both questions use, and a word for each score. */
export class MealCheckInScale {
  static readonly MIN = 1;

  static readonly MAX = 5;

  static readonly FULLNESS_WORDS = [
    'Still hungry',
    'A little hungry',
    'Satisfied',
    'Full',
    'Too full',
  ];

  static readonly FEELING_WORDS = ['Rough', 'Low', 'Okay', 'Good', 'Great'];
}

/** Every score on the scale, lowest first. */
export const MEAL_SCORES = Array.from(
  { length: MealCheckInScale.MAX - MealCheckInScale.MIN + 1 },
  (_, i) => MealCheckInScale.MIN + i,
);

export const isValidMealScore = (n: number) =>
  Number.isInteger(n) && n >= MealCheckInScale.MIN && n <= MealCheckInScale.MAX;

/** The word for a score, so a bare number has some meaning. */
export function mealScoreWord(
  metric: MealCheckInMetric,
  score: number,
): string {
  const words =
    metric === MealCheckInMetric.Fullness
      ? MealCheckInScale.FULLNESS_WORDS
      : MealCheckInScale.FEELING_WORDS;
  const i = Math.min(
    Math.max(Math.round(score), MealCheckInScale.MIN),
    MealCheckInScale.MAX,
  );
  return words[i - MealCheckInScale.MIN];
}

/** One line for a check-in: "Satisfied · feeling good". */
export function describeMealCheckIn(c: MealCheckIn): string {
  return `${mealScoreWord(MealCheckInMetric.Fullness, c.fullness)} · feeling ${mealScoreWord(MealCheckInMetric.Feeling, c.feeling).toLowerCase()}`;
}

/** The check-in for one meal on one day, if there is one. */
export const checkInFor = (
  entries: readonly MealCheckIn[],
  day: string,
  meal: Meal,
) => entries.find((e) => e.day === day && e.meal === meal);
