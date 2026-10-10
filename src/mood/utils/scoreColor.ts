import { colors } from '@shared/theme';
import { clampScore, MoodScale, MoodMetric } from '@mood/models/moodEntry';

import { mix } from '@shared/utils/color';

export { mix };

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
  const t = (clampScore(score) - MoodScale.MIN) / (MoodScale.MAX - MoodScale.MIN);
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
  return metric === MoodMetric.Mood ? t : -t;
}
