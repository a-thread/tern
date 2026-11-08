import { DayRecord } from '../../domain/activity/models/dayRecord';
import { DayState } from '@shared/models/dayState';
import { monthName, weekdayLetter } from '@shared/utils/date';
import { TrendRanges, TrendRange } from './trendRange';
import type { BarDays } from './barDate';

/** `day` is set on daily bars, `week` on weekly averages. */
export type StepBar = BarDays & {
  label: string;
  value: number;
  state: DayState;
};

/** A tapped step bar's value: "8,410 steps", or "8,410 steps a day" for a week's average. */
export const stepsValue = (bar: StepBar): string =>
  `${bar.value.toLocaleString()} steps${bar.week ? ' a day' : ''}`;

/**
 * Build step-chart bars: daily bars for a week or month, or weekly averages
 * for six months. Weekly bars are labelled when a new month begins.
 */
export function bucketSteps(days: DayRecord[], range: TrendRange): StepBar[] {
  if (range === TrendRange.Week || range === TrendRange.Month) {
    return days.slice(-TrendRanges.DAYS[range]).map((d) => ({
      label: range === TrendRange.Week ? weekdayLetter(d.day) : '',
      day: d.day,
      value: d.steps,
      // The steps chart is about steps: a rest day that reached the goal anyway is drawn as one,
      // matching the goal days counted beside it.
      state: d.reachedGoal ? DayState.Goal : d.state,
    }));
  }

  const recent = days.slice(-7 * TrendRanges.WEEKLY_BARS);
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
      week: { from: chunk[0].day, to: chunk[chunk.length - 1].day },
      value,
      state:
        withData.length === 0
          ? DayState.None
          : value >= goal
            ? DayState.Goal
            : DayState.Partial,
    };
  });
}
