import type { DayRecord } from './dayRecord';
import { StepGoal } from '../../settings/models/stepGoalHistory';

/**
 * A gentle, optional suggestion for the step goal, from the last 30 days that
 * have steps. Only when the goal is clearly off: reached on nearly every day
 * (suggest a bit more) or on very few (suggest something more reachable).
 * Null when there's too little data or the goal already fits.
 */
export function suggestGoal(
  days: DayRecord[],
  currentGoal: number,
): number | null {
  const recent = days.slice(-30).filter((d) => d.steps > 0);
  if (recent.length < 14) return null;
  const hitRate =
    recent.filter((d) => d.steps >= d.goal).length / recent.length;
  const round = (n: number) => Math.round(n / 100) * 100;

  if (hitRate >= 0.9) {
    const next = Math.min(currentGoal + 1000, StepGoal.MAX);
    return next > currentGoal ? next : null;
  }
  if (hitRate <= 0.25) {
    const sorted = recent.map((d) => d.steps).sort((a, b) => a - b);
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    const next = Math.max(round(p75), StepGoal.MIN);
    return next <= currentGoal - 500 ? next : null;
  }
  return null;
}
