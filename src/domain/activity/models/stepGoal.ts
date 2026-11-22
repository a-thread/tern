import type { DayRecord } from './dayRecord';
import { StepGoal } from '../../settings/models/stepGoalHistory';

/**
 * A step goal suggestion from the last 30 days with steps, only when it's clearly too easy or
 * too hard. Days made goal days by movement are left out.
 */
export function suggestGoal(
  days: DayRecord[],
  currentGoal: number,
): number | null {
  const recent = days.slice(-30).filter((d) => d.steps > 0 && !d.movedToGoal);
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
