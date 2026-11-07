import { formatLongDate } from '@shared/utils/date';
import { DayState } from '@shared/models/dayState';
import type { DayRecord } from '@/domain/activity/models/dayRecord';

/**
 * What a screen reader says for one ring of the week strip: the date, then how the day went
 * ("Tuesday, Oct 20, goal reached"), since the ring itself is only a colour and a letter.
 */
export function dayRingLabel(
  d: Pick<
    DayRecord,
    | 'day'
    | 'steps'
    | 'goal'
    | 'minutes'
    | 'movedToGoal'
    | 'reachedGoal'
    | 'chosenRest'
    | 'state'
    | 'isToday'
    | 'future'
  >,
  movementGoalMinutes: number,
): string {
  const date = `${d.isToday ? 'Today, ' : ''}${formatLongDate(d.day)}`;
  return `${date}, ${dayStatus(d, movementGoalMinutes)}`;
}

function dayStatus(
  d: Pick<
    DayRecord,
    | 'steps'
    | 'goal'
    | 'minutes'
    | 'movedToGoal'
    | 'reachedGoal'
    | 'chosenRest'
    | 'state'
    | 'future'
  >,
  movementGoalMinutes: number,
): string {
  if (d.future) return 'not yet';
  switch (d.state) {
    case DayState.Rest:
      // A rest day stays one even if the goal is reached; say so, since the ring can't.
      if (d.reachedGoal) return 'rest day, goal reached';
      // One Tern counted on its own (auto-detect) says so: it wasn't taken.
      return d.chosenRest
        ? 'rest day'
        : 'under the goal, counted as a rest day';
    case DayState.Frozen:
      return 'covered by a streak freeze';
    case DayState.Goal:
      return d.movedToGoal ? 'goal reached by movement' : 'goal reached';
    default: {
      const steps = `${d.steps.toLocaleString()} of ${d.goal.toLocaleString()} steps`;
      return movementGoalMinutes > 0 && d.minutes > 0
        ? `${steps}, ${d.minutes} of ${movementGoalMinutes} minutes moved`
        : steps;
    }
  }
}
