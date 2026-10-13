import { addDays, dayKey } from '@shared/utils/date';
import { allMealsLogged } from './meals';
import type { FoodEntry } from './foodEntry';

/** Which way someone wants their weight to go, for the adaptive target. */
export enum Aim {
  Lose = 'lose',
  LoseSlowly = 'loseSlowly',
  Maintain = 'maintain',
  Gain = 'gain',
}

export const AIM_LABEL: Record<Aim, string> = {
  [Aim.Lose]: 'Lose',
  [Aim.LoseSlowly]: 'Lose slowly',
  [Aim.Maintain]: 'Maintain',
  [Aim.Gain]: 'Gain',
};

/**
 * The adaptive target: what someone really burns, worked out from what they
 * log and how their weight trends, never from per-workout estimates. See
 * docs/adaptive-target.md.
 */
export class AdaptiveTarget {
  /** Days the estimate looks back over (yesterday and before; today is still being logged). */
  static readonly WINDOW_DAYS = 21;
  /** Fully logged days needed in the window. */
  static readonly MIN_LOGGED_DAYS = 14;
  /** Weigh-ins needed in the window, and in each half of it. */
  static readonly MIN_WEIGH_INS = 6;
  static readonly MIN_WEIGH_INS_PER_HALF = 2;
  /** Roughly the energy in a pound of body weight. */
  static readonly KCAL_PER_LB = 3500;
  /** How far a suggestion may move the target in one week. */
  static readonly MAX_WEEKLY_CHANGE = 100;
  /** The fastest loss a target will aim for: this share of body weight a week. */
  static readonly MAX_LOSS_SHARE = 0.01;
  static readonly FLOOR = 1200;
  static readonly ROUND = 50;
  /** A suggestion closer than this to the current target isn't worth offering. */
  static readonly MIN_DIFFERENCE = 50;
  /** Days the daily weight trend averages over. */
  static readonly TREND_DAYS = 10;
  static readonly AIM_OFFSET: Record<Aim, number> = {
    [Aim.Lose]: -500,
    [Aim.LoseSlowly]: -250,
    [Aim.Maintain]: 0,
    [Aim.Gain]: 250,
  };
}

type Weigh = { lb: number; loggedAt: string };
type Logged = Pick<FoodEntry, 'meal' | 'calories' | 'servings'>;

/**
 * A smoothed weight for every day from `from` to `to`: weigh-ins averaged per
 * day, days between them filled in on a straight line, then an exponential
 * average over about `TREND_DAYS` days. Unlike the chart's trend (which moves
 * per weigh-in), this one moves per day, so a change over the window is a
 * change over that many days. Days before the first weigh-in are left out.
 */
export function dailyTrend(weighs: readonly Weigh[], from: string, to: string): Record<string, number> {
  const byDay = new Map<string, number[]>();
  for (const w of weighs) {
    const d = dayKey(new Date(w.loggedAt));
    if (d > to) continue;
    byDay.set(d, [...(byDay.get(d) ?? []), w.lb]);
  }
  const days = [...byDay.keys()].sort();
  if (!days.length) return {};
  const reading = new Map(days.map((d) => [d, byDay.get(d)!.reduce((a, b) => a + b, 0) / byDay.get(d)!.length]));

  const alpha = 2 / (AdaptiveTarget.TREND_DAYS + 1);
  const out: Record<string, number> = {};
  let trend: number | null = null;
  let prevDay = days[0];
  let next = 1;
  for (let d = days[0]; d <= to; d = addDays(d, 1)) {
    while (next < days.length && days[next] < d) next++;
    let value: number;
    if (reading.has(d)) {
      value = reading.get(d)!;
      prevDay = d;
    } else if (next < days.length) {
      // On the line between the last weigh-in and the next one.
      const a = reading.get(prevDay)!;
      const b = reading.get(days[next])!;
      const span = daysBetween(prevDay, days[next]);
      value = a + ((b - a) * daysBetween(prevDay, d)) / span;
    } else {
      value = reading.get(prevDay)!;
    }
    trend = trend === null ? value : trend + alpha * (value - trend);
    if (d >= from) out[d] = trend;
  }
  return out;
}

const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/**
 * Days logged fully enough to trust: food in at least two meals, or every core
 * meal accounted for (logged or marked "nothing today"). Empty days are left
 * out, never counted as eating nothing.
 */
export function completeDays(
  byDay: Record<string, readonly Logged[]>,
  skippedByDay: Record<string, readonly FoodEntry['meal'][]> = {},
): string[] {
  return Object.keys(byDay)
    .filter((d) => {
      const entries = byDay[d];
      if (!entries.length) return false;
      const meals = new Set(entries.map((e) => e.meal));
      return meals.size >= 2 || allMealsLogged(entries as FoodEntry[], skippedByDay[d] ?? []);
    })
    .sort();
}

export type BurnEstimate =
  | {
      status: 'ready';
      /** Calories burned per day. */
      kcal: number;
      low: number;
      high: number;
      meanIntake: number;
      /** Change in trend weight over the window, in pounds (negative is a loss). */
      trendChangeLb: number;
      loggedDays: number;
      weightLb: number;
    }
  | {
      status: 'learning';
      loggedDays: number;
      neededDays: number;
      weighIns: number;
      neededWeighIns: number;
    };

/**
 * What someone burns a day, from the last `WINDOW_DAYS` days (ending
 * yesterday): their average logged intake, less the energy their trend weight
 * gained (or plus what it lost). Still "learning" until there are enough fully
 * logged days and weigh-ins spread across the window.
 */
export function estimateBurn(input: {
  foodByDay: Record<string, readonly Logged[]>;
  skippedByDay?: Record<string, readonly FoodEntry['meal'][]>;
  weighs: readonly Weigh[];
  today: string;
}): BurnEstimate {
  const to = addDays(input.today, -1);
  // WINDOW_DAYS of change: the trend from the day before the window to yesterday.
  const from = addDays(input.today, -(AdaptiveTarget.WINDOW_DAYS + 1));
  const mid = addDays(from, Math.floor(AdaptiveTarget.WINDOW_DAYS / 2));

  const inWindow = (d: string) => d >= from && d <= to;
  const logged = completeDays(input.foodByDay, input.skippedByDay).filter(inWindow);
  const weighDays = input.weighs.map((w) => dayKey(new Date(w.loggedAt))).filter(inWindow);
  const firstHalf = weighDays.filter((d) => d < mid).length;
  const secondHalf = weighDays.length - firstHalf;

  const enough =
    logged.length >= AdaptiveTarget.MIN_LOGGED_DAYS &&
    weighDays.length >= AdaptiveTarget.MIN_WEIGH_INS &&
    firstHalf >= AdaptiveTarget.MIN_WEIGH_INS_PER_HALF &&
    secondHalf >= AdaptiveTarget.MIN_WEIGH_INS_PER_HALF;
  if (!enough) {
    return {
      status: 'learning',
      loggedDays: logged.length,
      neededDays: AdaptiveTarget.MIN_LOGGED_DAYS,
      weighIns: weighDays.length,
      neededWeighIns: AdaptiveTarget.MIN_WEIGH_INS,
    };
  }

  const trend = dailyTrend(input.weighs, from, to);
  const start = trend[from] ?? Object.values(trend)[0];
  const end = trend[to];
  const change = end - start;

  const intakes = logged.map((d) =>
    input.foodByDay[d].reduce((sum, e) => sum + e.calories * e.servings, 0),
  );
  const mean = intakes.reduce((a, b) => a + b, 0) / intakes.length;
  const kcal = mean - (change * AdaptiveTarget.KCAL_PER_LB) / AdaptiveTarget.WINDOW_DAYS;

  // How sure: the spread of daily intake, plus a little for the weight trend.
  const sd = Math.sqrt(intakes.reduce((s, x) => s + (x - mean) ** 2, 0) / intakes.length);
  const margin = Math.round((1.96 * sd) / Math.sqrt(intakes.length) + 50);

  return {
    status: 'ready',
    kcal: Math.round(kcal),
    low: Math.round(kcal - margin),
    high: Math.round(kcal + margin),
    meanIntake: Math.round(mean),
    trendChangeLb: Math.round(change * 10) / 10,
    loggedDays: logged.length,
    weightLb: end,
  };
}

/**
 * A target for the aim: the burn plus the aim's offset, never a faster loss
 * than `MAX_LOSS_SHARE` of body weight a week, never below `FLOOR`, and at most
 * `MAX_WEEKLY_CHANGE` away from the current target. Rounded to 50.
 */
export function suggestTarget(burnKcal: number, aim: Aim, currentTarget: number, weightLb: number): number {
  const fastest = (weightLb * AdaptiveTarget.MAX_LOSS_SHARE * AdaptiveTarget.KCAL_PER_LB) / 7;
  let target = burnKcal + AdaptiveTarget.AIM_OFFSET[aim];
  target = Math.max(target, burnKcal - fastest, AdaptiveTarget.FLOOR);
  target = Math.min(
    Math.max(target, currentTarget - AdaptiveTarget.MAX_WEEKLY_CHANGE),
    currentTarget + AdaptiveTarget.MAX_WEEKLY_CHANGE,
  );
  return Math.round(target / AdaptiveTarget.ROUND) * AdaptiveTarget.ROUND;
}

/** Whether a suggestion is far enough from the current target to offer. */
export const worthSuggesting = (suggested: number, currentTarget: number) =>
  Math.abs(suggested - currentTarget) >= AdaptiveTarget.MIN_DIFFERENCE;

export type EnergyWeek = { weekEnd: string; burn: number | null; intake: number | null };

/**
 * Week by week, oldest first: average logged intake on fully logged days, and
 * the burn estimated as of the end of that week (null while still learning).
 */
export function weeklyEnergy(input: {
  foodByDay: Record<string, readonly Logged[]>;
  skippedByDay?: Record<string, readonly FoodEntry['meal'][]>;
  weighs: readonly Weigh[];
  today: string;
  weeks: number;
}): EnergyWeek[] {
  const complete = new Set(completeDays(input.foodByDay, input.skippedByDay));
  return Array.from({ length: input.weeks }, (_, k) => {
    const w = input.weeks - 1 - k;
    // The estimate as it stood the day after this week ended.
    const asOf = addDays(input.today, -7 * w);
    const weekEnd = addDays(asOf, -1);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekEnd, -i)).filter((d) => complete.has(d));
    const intake = days.length
      ? Math.round(
          days.reduce((s, d) => s + input.foodByDay[d].reduce((t, e) => t + e.calories * e.servings, 0), 0) /
            days.length,
        )
      : null;
    const est = estimateBurn({ ...input, today: asOf });
    return { weekEnd, burn: est.status === 'ready' ? est.kcal : null, intake };
  });
}
