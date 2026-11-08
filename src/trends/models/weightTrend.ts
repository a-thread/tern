import { computeTrend } from '../../domain/weight/models/weightTrend';
import type { WeightEntry } from '../../domain/weight/models/weightEntry';
import { dayKey } from '@shared/utils/date';

/** The weigh-ins logged in the last `rangeDays` days (all of them for `Infinity`), newest first. */
function entriesInRange(
  entriesNewestFirst: WeightEntry[],
  rangeDays: number,
  now: Date,
): WeightEntry[] {
  const cutoff = Number.isFinite(rangeDays)
    ? new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (rangeDays - 1),
      ).getTime()
    : -Infinity;
  return entriesNewestFirst.filter(
    (e) => new Date(e.loggedAt).getTime() >= cutoff,
  );
}

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
  const inRange = entriesInRange(entriesNewestFirst, rangeDays, now).length;
  const all = computeTrend(entriesNewestFirst, entriesNewestFirst.length);
  return inRange ? all.slice(all.length - inRange) : [];
}

/** The day of each point `weightTrendFor` returns for the same range, oldest first. */
export function weightTrendDaysFor(
  entriesNewestFirst: WeightEntry[],
  rangeDays: number,
  now: Date = new Date(),
): string[] {
  return entriesInRange(entriesNewestFirst, rangeDays, now)
    .map((e) => dayKey(new Date(e.loggedAt)))
    .reverse();
}
