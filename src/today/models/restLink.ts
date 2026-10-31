/**
 * Whether today offers a rest-day link ("Take today as a rest day", or undo it). A rest day
 * taken can always be undone, even once the goal is reached; a new one can't be taken once
 * it is (it would only add the rest day's waypoints to a day already done), or with none left
 * this week. The week strip shows the link by it, and the tips on Today only explain
 * rest days when it's there to point at. `todayReached` is today's `DayRecord.reachedGoal`.
 */
export function showsRestLink(input: {
  todayReached: boolean;
  todayIsRest: boolean;
  restLeft: number;
}): boolean {
  return input.todayIsRest || (!input.todayReached && input.restLeft > 0);
}
