import { DayState } from '@shared/models/dayState';

type TodayInput = {
  todaySteps: number;
  stepGoal: number;
  todayState: DayState | undefined;
};

/** Today is a goal day: by steps, or by movement (its state says so). */
export function reachedGoalToday(input: TodayInput): boolean {
  return (
    input.todaySteps / input.stepGoal >= 1 || input.todayState === DayState.Goal
  );
}

/**
 * Whether today offers a rest-day link ("Take today as a rest day", or undo it): not once the
 * goal is reached (a goal day is never also a rest day), and only while one is taken or some
 * are left this week. The week strip shows the link by it, and the tips on Today only explain
 * rest days when it's there to point at.
 */
export function showsRestLink(
  input: TodayInput & { todayIsRest: boolean; restLeft: number },
): boolean {
  return !reachedGoalToday(input) && (input.todayIsRest || input.restLeft > 0);
}
