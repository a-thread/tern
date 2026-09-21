import type { DayRecord, DayState } from '@today/models';
import { monthName, weekdayLetter } from '@shared/utils/date';
import { computeTrend, type WeightEntry } from '@weight/models';

/** The ranges the Trends screens offer, and how many days each covers. */
export const RANGE_DAYS = { Week: 7, Month: 30, '6 months': 180 } as const;
export type StepRange = keyof typeof RANGE_DAYS;

export type StepBar = { label: string; value: number; state: DayState };

/** Half a year is drawn as this many weekly bars (more, and they get too thin to read). */
const WEEKLY_BARS = 25;

/**
 * Build step-chart bars: daily bars for a week or month, or weekly averages
 * for six months. Weekly bars are labelled when a new month begins.
 */
export function bucketSteps(days: DayRecord[], range: StepRange): StepBar[] {
  if (range === 'Week' || range === 'Month') {
    return days.slice(-RANGE_DAYS[range]).map((d) => ({
      label: range === 'Week' ? weekdayLetter(d.day) : '',
      value: d.steps,
      state: d.state,
    }));
  }

  const recent = days.slice(-7 * WEEKLY_BARS);
  const chunks: DayRecord[][] = [];
  for (let end = recent.length; end > 0; end -= 7) {
    chunks.unshift(recent.slice(Math.max(end - 7, 0), end));
  }
  let lastMonth = '';
  return chunks.map((chunk) => {
    const withData = chunk.filter((d) => d.steps > 0);
    const value = withData.length
      ? Math.round(
          withData.reduce((sum, d) => sum + d.steps, 0) / withData.length,
        )
      : 0;
    const goal = chunk.reduce((sum, d) => sum + d.goal, 0) / chunk.length;
    const month = monthName(chunk[0].day);
    const label = month !== lastMonth ? month[0] : '';
    lastMonth = month;
    return {
      label,
      value,
      state:
        withData.length === 0 ? 'none' : value >= goal ? 'goal' : 'partial',
    };
  });
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

/** Longest consecutive run of goal or rest days; partial and none reset it. */
export function longestProtectedRun(days: DayState[]): number {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    if (day === 'goal' || day === 'rest') {
      current += 1;
      longest = Math.max(longest, current);
    } else {
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
