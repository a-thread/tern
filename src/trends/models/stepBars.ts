import { DayRecord } from '@today/models/dayRecord';
import { DayState } from '@shared/models/dayState';
import { monthName, weekdayLetter } from '@shared/utils/date';
import { TrendRanges, TrendRange } from '@shared/models/trendRange';

export type StepBar = { label: string; value: number; state: DayState };

/**
 * Build step-chart bars: daily bars for a week or month, or weekly averages
 * for six months. Weekly bars are labelled when a new month begins.
 */
export function bucketSteps(days: DayRecord[], range: TrendRange): StepBar[] {
  if (range === TrendRange.Week || range === TrendRange.Month) {
    return days.slice(-TrendRanges.DAYS[range]).map((d) => ({
      label: range === TrendRange.Week ? weekdayLetter(d.day) : '',
      value: d.steps,
      state: d.state,
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
      value,
      state:
        withData.length === 0 ? DayState.None : value >= goal ? DayState.Goal : DayState.Partial,
    };
  });
}