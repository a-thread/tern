import { computeTrend } from '@weight/models/weightTrend';
import type { WeightEntry } from '@weight/models/weightEntry';

/**
 * Returns the smoothed weight trend for the last `rangeDays` days.
 * Pass `Infinity` to include all entries. Entries must be newest-first; the
 * trend is calculated from the full history before the range is selected.
 */
export function weightTrendFor(
  entriesNewestFirst: WeightEntry[],
  rangeDays: number,
  now: Date = new Date(),
): number[] {
  const cutoff = Number.isFinite(rangeDays)
    ? new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (rangeDays - 1),
      ).getTime()
    : -Infinity;
  const inRange = entriesNewestFirst.filter(
    (e) => new Date(e.loggedAt).getTime() >= cutoff,
  ).length;
  const all = computeTrend(entriesNewestFirst, entriesNewestFirst.length);
  return inRange ? all.slice(all.length - inRange) : [];
}