import { DayState } from '@shared/models/dayState';
import {
  addsToStreak,
  type DayRecord,
} from '../../domain/activity/models/dayRecord';

/**
 * The longest streak in `days`, counted the way Today counts the streak (`computeStreak`): a
 * goal day adds one (a rest day walked to the goal too), a rest or frozen day holds it without
 * adding, today doesn't break it while it's in progress, and a partial or missed day ends it.
 */
export function longestConsecutiveStreak(
  days: readonly Pick<DayRecord, 'state' | 'reachedGoal' | 'isToday'>[],
): number {
  let longest = 0;
  let current = 0;
  for (const d of days) {
    if (addsToStreak(d)) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (
      d.state !== DayState.Rest &&
      d.state !== DayState.Frozen &&
      !d.isToday
    ) {
      current = 0;
    }
  }
  return longest;
}

export type StepsSummary = {
  /** Mean steps over days that have step data; null when there are none. */
  average: number | null;
  /** Change versus the same-length period before it, in percent; null when either has no data. */
  changePct: number | null;
};

const mean = (days: DayRecord[]): number | null => {
  const withData = days.filter((d) => d.steps > 0);
  if (!withData.length) return null;
  return withData.reduce((sum, d) => sum + d.steps, 0) / withData.length;
};

/** Average steps over the last `n` days of `days` (oldest to newest), and how it compares with the `n` before. */
export function summarizeSteps(days: DayRecord[], n: number): StepsSummary {
  const current = mean(days.slice(-n));
  const previousDays = days.slice(-2 * n, -n);
  const previous = previousDays.length === n ? mean(previousDays) : null;
  return {
    average: current === null ? null : Math.round(current),
    changePct:
      current === null || previous === null
        ? null
        : Math.round(((current - previous) / previous) * 100),
  };
}
