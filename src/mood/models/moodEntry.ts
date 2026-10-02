/** One day's check-in: mood and stress, each 1 to 10. `day` is the local day (YYYY-MM-DD). */
export type MoodEntry = { day: string; mood: number; stress: number };

export type MoodMetric = 'mood' | 'stress';

/** The 1 to 10 scale mood and stress are scored on, and the word for each score. */
export class MoodScale {
  static readonly MIN = 1;

  static readonly MAX = 10;

  /** Where the ruler starts when nothing has been logged yet. */
  static readonly DEFAULT = 5;

  static readonly MOOD_WORDS = ['Very low', 'Low', 'Low', 'Down', 'Okay', 'Okay', 'Good', 'Good', 'Great', 'Great'];

  static readonly STRESS_WORDS = ['Calm', 'Calm', 'Relaxed', 'Mild', 'Some', 'Some', 'Tense', 'High', 'Very high', 'Very high'];
}

export const isValidScore = (n: number) =>
  Number.isInteger(n) && n >= MoodScale.MIN && n <= MoodScale.MAX;

/** Rounds to a whole score and keeps it on the scale. */
export const clampScore = (n: number) =>
  Math.min(Math.max(Math.round(Number.isFinite(n) ? n : MoodScale.DEFAULT), MoodScale.MIN), MoodScale.MAX);

/** A word for a score, so a bare number has some meaning. */
export function scoreWord(metric: MoodMetric, score: number): string {
  const words = metric === 'mood' ? MoodScale.MOOD_WORDS : MoodScale.STRESS_WORDS;
  return words[clampScore(score) - 1];
}