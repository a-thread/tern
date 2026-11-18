import type { WeightEntry } from './weightEntry';

/** How the weight trend line is smoothed. */
export class TrendSmoothing {
  /** How far back the trend line reaches. */
  static readonly POINTS = 30;

  /** Smoothing weight of each new reading — low, so one heavy or light day barely moves the line. */
  static readonly ALPHA = 0.3;
}

/** EMA, oldest to newest, from newest-first entries. */
export function computeTrend(
  entriesNewestFirst: WeightEntry[],
  maxPoints: number = TrendSmoothing.POINTS,
): number[] {
  const trend: number[] = [];
  for (const entry of [...entriesNewestFirst].reverse()) {
    const prev = trend[trend.length - 1];
    const next =
      prev === undefined
        ? entry.lb
        : prev + TrendSmoothing.ALPHA * (entry.lb - prev);
    trend.push(Math.round(next * 100) / 100);
  }
  return maxPoints > 0 ? trend.slice(-maxPoints) : [];
}
