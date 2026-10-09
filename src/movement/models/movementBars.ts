import { TrendRanges, TrendRange } from '@shared/models/trendRange';
import { addDays, monthName, weekdayLetter } from '@shared/utils/date';
import { DayState } from '@shared/models/dayState';

export type MovementBar = { label: string; value: number; state: DayState };

const daysEnding = (today: string, count: number) =>
  Array.from({ length: count }, (_, i) => addDays(today, i - (count - 1)));

const barState = (minutes: number, goal: number): DayState =>
  minutes <= 0 ? DayState.None : minutes >= goal ? DayState.Goal : DayState.Partial;

/**
 * Minutes moved as bars, like the steps chart: one per day for a week or a
 * month, a weekly total for six months. A bar reads as a goal day when the
 * minutes that count toward one (`goalByDay`, all of them if absent) reach it.
 */
export function bucketMinutes(
  byDay: Readonly<Record<string, number>>,
  goal: number,
  range: TrendRange,
  today: string,
  goalByDay: Readonly<Record<string, number>> = byDay,
): MovementBar[] {
  if (range === TrendRange.Week || range === TrendRange.Month) {
    return daysEnding(today, TrendRanges.DAYS[range]).map((day) => ({
      label: range === TrendRange.Week ? weekdayLetter(day) : '',
      value: byDay[day] ?? 0,
      state: barState(byDay[day] ?? 0, goal) === DayState.None ? DayState.None : (goalByDay[day] ?? 0) >= goal ? DayState.Goal : DayState.Partial,
    }));
  }
  const keys = daysEnding(today, 7 * TrendRanges.WEEKLY_BARS);
  const bars: MovementBar[] = [];
  let lastMonth = '';
  for (let i = 0; i < keys.length; i += 7) {
    const week = keys.slice(i, i + 7);
    const total = week.reduce((s, d) => s + (byDay[d] ?? 0), 0);
    const counted = week.reduce((s, d) => s + (goalByDay[d] ?? 0), 0);
    const month = monthName(week[0]);
    // A week is a goal week when it averages the daily goal.
    const state = total <= 0 ? DayState.None : counted / 7 >= goal ? DayState.Goal : DayState.Partial;
    bars.push({ label: month !== lastMonth ? month[0] : '', value: total, state });
    lastMonth = month;
  }
  return bars;
}

/** Average minutes a day over the range, counting days with nothing as zero; null when nothing was logged. */
export function averageMinutes(byDay: Readonly<Record<string, number>>, today: string, days: number): number | null {
  const values = daysEnding(today, days).map((d) => byDay[d] ?? 0);
  const total = values.reduce((s, v) => s + v, 0);
  return total > 0 ? Math.round(total / days) : null;
}
