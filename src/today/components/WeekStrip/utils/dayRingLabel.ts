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
    'steps' | 'goal' | 'minutes' | 'movedToGoal' | 'state' | 'future'
  >,
  movementGoalMinutes: number,
): string {
  if (d.future) return 'not yet';
  switch (d.state) {
    case DayState.Rest:
      return 'rest day';
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
