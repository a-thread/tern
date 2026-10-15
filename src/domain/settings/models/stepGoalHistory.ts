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
