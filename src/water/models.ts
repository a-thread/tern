import { monthName, weekdayLetter } from '@shared/utils/date';

/** One drink. `oz` is US fluid ounces (millilitres are a display choice); `loggedOn` is the local day (YYYY-MM-DD). */
export type WaterEntry = { id: string; oz: number; loggedOn: string; loggedAt: string };

export const DEFAULT_WATER_GOAL_OZ = 64;
export const MIN_WATER_GOAL_OZ = 16;
export const MAX_WATER_GOAL_OZ = 200;
/** The largest single drink the database accepts (a little over 5 litres). */
export const MAX_DRINK_OZ = 170;
/** The smallest: a sip. */
export const MIN_DRINK_OZ = 0.1;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Whether `oz` is a drink Tern can store: more than a drop, less than a small barrel. */
export function isValidDrink(oz: number): boolean {
  return Number.isFinite(oz) && oz >= MIN_DRINK_OZ && oz <= MAX_DRINK_OZ;
}

/** Ounces drunk on a day. */
export function dayTotal(entries: readonly WaterEntry[], day: string): number {
  return round2(entries.reduce((sum, e) => (e.loggedOn === day ? sum + e.oz : sum), 0));
}

/** Ounces per day, keyed by day. */
export function totalsByDay(entries: readonly WaterEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) out[e.loggedOn] = round2((out[e.loggedOn] ?? 0) + e.oz);
  return out;
}

/** 0 to 1 (capped) progress toward a goal. */
export function waterProgress(oz: number, goalOz: number): number {
  return goalOz > 0 ? Math.min(oz / goalOz, 1) : 0;
}

/** Keeps a goal within what makes sense. */
export const clampWaterGoal = (oz: number) =>
  Math.min(Math.max(round2(oz), MIN_WATER_GOAL_OZ), MAX_WATER_GOAL_OZ);

/** The most recent drink logged on a day, if any. */
export function lastDrink(entries: readonly WaterEntry[], day: string): WaterEntry | undefined {
  let last: WaterEntry | undefined;
  for (const e of entries) {
    if (e.loggedOn === day && (!last || e.loggedAt >= last.loggedAt)) last = e;
  }
  return last;
}

export type WaterBar = { label: string; value: number; state: 'goal' | 'partial' | 'none' };
export type WaterRange = 'Week' | 'Month' | '6 months';
const RANGE_DAYS = { Week: 7, Month: 30, '6 months': 180 } as const;
const WEEKLY_BARS = 25;

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
  range: WaterRange,
  today: string,
): WaterBar[] {
  if (range === 'Week' || range === 'Month') {
    return dayKeys(today, RANGE_DAYS[range]).map((day) => ({
      label: range === 'Week' ? weekdayLetter(day) : '',
      value: byDay[day] ?? 0,
      state: barState(byDay[day] ?? 0, goalOz),
    }));
  }
  const keys = dayKeys(today, 7 * WEEKLY_BARS);
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
