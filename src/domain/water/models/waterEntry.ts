/** One drink. `oz` is US fluid ounces (millilitres are a display choice); `loggedOn` is the local day (YYYY-MM-DD). */
export type WaterEntry = { id: string; oz: number; loggedOn: string; loggedAt: string };

/** What a drink and a daily water goal can be. */
export class WaterLimits {
  static readonly DEFAULT_GOAL_OZ = 64;

  static readonly MIN_GOAL_OZ = 16;

  static readonly MAX_GOAL_OZ = 200;

  /** The largest single drink the database accepts (a little over 5 litres). */
  static readonly MAX_DRINK_OZ = 170;

  /** The smallest: a sip. */
  static readonly MIN_DRINK_OZ = 0.1;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Whether `oz` is a drink Tern can store: more than a drop, less than a small barrel. */
export function isValidDrink(oz: number): boolean {
  return Number.isFinite(oz) && oz >= WaterLimits.MIN_DRINK_OZ && oz <= WaterLimits.MAX_DRINK_OZ;
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
  Math.min(Math.max(round2(oz), WaterLimits.MIN_GOAL_OZ), WaterLimits.MAX_GOAL_OZ);

/** The most recent drink logged on a day, if any. */
export function lastDrink(entries: readonly WaterEntry[], day: string): WaterEntry | undefined {
  let last: WaterEntry | undefined;
  for (const e of entries) {
    if (e.loggedOn === day && (!last || e.loggedAt >= last.loggedAt)) last = e;
  }
  return last;
}