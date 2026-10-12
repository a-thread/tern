import type { DayRecord } from './dayRecord';

/** One step-goal change: `goal` applies from `from` (a day key) until the next entry. */
export type GoalChange = { from: string; goal: number };

/** The limits of the daily step goal. */
export class StepGoal {
  /** The first entry's `from`, meaning "since the beginning". */
  static readonly SINCE_ALWAYS = '0000-00-00';

  static readonly MIN = 2000;

  static readonly MAX = 15000;
}

/**
 * Records a change of step goal effective today. Past days keep the goal they
 * were judged against, so raising the goal never retroactively breaks a
 * streak (and lowering it never rewrites history either). Changes made on the
 * same day replace each other, so dragging a slider leaves one entry.
 */
export function recordGoalChange(
  history: GoalChange[],
  previousGoal: number,
  nextGoal: number,
  today: string,
): GoalChange[] {
  if (previousGoal === nextGoal) return history;
  const base = history.length
    ? history
    : [{ from: StepGoal.SINCE_ALWAYS, goal: previousGoal }];
  const last = base[base.length - 1];
  if (last.from === today) {
    const earlier = base.slice(0, -1);
    // Back to what it was before today: nothing to record.
    if (earlier.length && earlier[earlier.length - 1].goal === nextGoal) {
      return earlier;
    }
    return [...earlier, { from: today, goal: nextGoal }];
  }
  return [...base, { from: today, goal: nextGoal }];
}

/** The step goal that applied on `day`. With no recorded changes, it's the current goal. */
export function goalFor(
  history: GoalChange[],
  currentGoal: number,
  day: string,
): number {
  if (!history.length) return currentGoal;
  let goal = history[0].goal;
  for (const change of history) {
    if (change.from <= day) goal = change.goal;
  }
  return goal;
}

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
  const hitRate = recent.filter((d) => d.steps >= d.goal).length / recent.length;
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