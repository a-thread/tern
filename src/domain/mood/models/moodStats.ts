import { round1 } from '@shared/utils/number';
import type { MoodEntry, MoodMetric } from './moodEntry';

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