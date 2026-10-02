import { TrendRanges, type TrendRange } from '@shared/models/trendRange';
import { monthName, weekdayLetter } from '@shared/utils/date';
import { round2 } from './waterEntry';

export type WaterBar = { label: string; value: number; state: 'goal' | 'partial' | 'none' };

const dayKeys = (today: string, count: number): string[] => {
  const [y, m, d] = today.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(y, m - 1, d - (count - 1 - i));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
};

const barState = (oz: number, goalOz: number): WaterBar['state'] =>
  oz <= 0 ? 'none' : oz >= goalOz ? 'goal' : 'partial';

/**
 * Bars for a range, like the steps chart: daily for a week or a month, weekly
 * averages (of days with something logged) for 6 months.
 */
export function bucketWater(
  byDay: Readonly<Record<string, number>>,
  goalOz: number,
  range: TrendRange,
  today: string,
): WaterBar[] {
  if (range === 'Week' || range === 'Month') {
    return dayKeys(today, TrendRanges.DAYS[range]).map((day) => ({
      label: range === 'Week' ? weekdayLetter(day) : '',
      value: byDay[day] ?? 0,
      state: barState(byDay[day] ?? 0, goalOz),
    }));
  }
  const keys = dayKeys(today, 7 * TrendRanges.WEEKLY_BARS);
  let lastMonth = '';
  const bars: WaterBar[] = [];
  for (let i = 0; i < keys.length; i += 7) {
    const week = keys.slice(i, i + 7);
    const withData = week.filter((d) => (byDay[d] ?? 0) > 0);
    const avg = withData.length
      ? round2(withData.reduce((s, d) => s + byDay[d], 0) / withData.length)
      : 0;
    const month = monthName(week[0]);
    bars.push({ label: month !== lastMonth ? month[0] : '', value: avg, state: barState(avg, goalOz) });
    lastMonth = month;
  }
  return bars;
}

/** Average ounces per day over days that have something logged; null when there are none. */
export function averageDaily(
  byDay: Readonly<Record<string, number>>,
  today: string,
  days: number,
): number | null {
  const totals = dayKeys(today, days)
    .map((d) => byDay[d] ?? 0)
    .filter((v) => v > 0);
  return totals.length ? round2(totals.reduce((s, v) => s + v, 0) / totals.length) : null;
}