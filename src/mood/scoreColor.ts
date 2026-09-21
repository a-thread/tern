import { colors } from '@shared/theme';
import { MAX_SCORE, MIN_SCORE, clampScore, type MoodMetric } from './models';

const channels = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** Blends two #rrggbb colors; `t` 0 is `a`, 1 is `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  const k = Math.min(Math.max(t, 0), 1);
  const to = (x: number, y: number) =>
    Math.round(x + (y - x) * k)
      .toString(16)
      .padStart(2, '0');
  return `#${to(ar, br)}${to(ag, bg)}${to(ab, bb)}`;
}

/**
 * Where a score sits on its colour scale. Nothing here is alarming or red: mood runs
 * from a quiet violet up to warm sun, stress from cool glacier through sun to a
 * heavy driftwood brown. Coral is left for actions.
 */
const STOPS: Record<MoodMetric, [string, string, string]> = {
  mood: [colors.violet, colors.waterMid, colors.sun],
  stress: [colors.glacier, colors.sun, colors.driftwood],
};

export function scoreColor(metric: MoodMetric, score: number): string {
  const t = (clampScore(score) - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
  const [low, mid, high] = STOPS[metric];
  return t < 0.5 ? mix(low, mid, t * 2) : mix(mid, high, (t - 0.5) * 2);
}

/** A soft wash of the score's colour, for backgrounds. */
export const scoreTint = (metric: MoodMetric, score: number) =>
  mix(scoreColor(metric, score), '#FFFFFF', 0.82);

/**
 * How far the mouth curves, from -1 (a frown) to 1 (a smile). Good mood and low
 * stress both read as a smile.
 */
export function smile(metric: MoodMetric, score: number): number {
  const t = (clampScore(score) - 5.5) / 4.5;
  return metric === 'mood' ? t : -t;
}
