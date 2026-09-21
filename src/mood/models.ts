/** One day's check-in: mood and stress, each 1 to 10. `day` is the local day (YYYY-MM-DD). */
export type MoodEntry = { day: string; mood: number; stress: number };

export type MoodMetric = 'mood' | 'stress';

export const MIN_SCORE = 1;
export const MAX_SCORE = 10;
/** Where the ruler starts when nothing has been logged yet. */
export const DEFAULT_SCORE = 5;

export const isValidScore = (n: number) =>
  Number.isInteger(n) && n >= MIN_SCORE && n <= MAX_SCORE;

/** Rounds to a whole score and keeps it on the scale. */
export const clampScore = (n: number) =>
  Math.min(Math.max(Math.round(Number.isFinite(n) ? n : DEFAULT_SCORE), MIN_SCORE), MAX_SCORE);

const MOOD_WORDS = ['Very low', 'Low', 'Low', 'Down', 'Okay', 'Okay', 'Good', 'Good', 'Great', 'Great'];
const STRESS_WORDS = ['Calm', 'Calm', 'Relaxed', 'Mild', 'Some', 'Some', 'Tense', 'High', 'Very high', 'Very high'];

/** A word for a score, so a bare number has some meaning. */
export function scoreWord(metric: MoodMetric, score: number): string {
  const words = metric === 'mood' ? MOOD_WORDS : STRESS_WORDS;
  return words[clampScore(score) - 1];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** The entry for a day, if there is one. */
export const entryFor = (entries: readonly MoodEntry[], day: string) =>
  entries.find((e) => e.day === day);

/** Entries from `from` to `to` inclusive, oldest first. */
export const entriesBetween = (entries: readonly MoodEntry[], from: string, to: string) =>
  entries.filter((e) => e.day >= from && e.day <= to).sort((a, b) => a.day.localeCompare(b.day));

/** The scores for one metric, oldest first, ready to chart. */
export const seriesOf = (entries: readonly MoodEntry[], metric: MoodMetric) =>
  entries.map((e) => e[metric]);

/** Average score to one decimal; null when there is nothing to average. */
export function average(entries: readonly MoodEntry[], metric: MoodMetric): number | null {
  if (!entries.length) return null;
  return round1(entries.reduce((sum, e) => sum + e[metric], 0) / entries.length);
}
