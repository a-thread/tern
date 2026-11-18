/** Undo is always offered; a new one isn't once the goal is reached (it'd only add waypoints) or none are left. */
export function showsRestLink(input: {
  todayReached: boolean;
  todayIsRest: boolean;
  restLeft: number;
}): boolean {
  return input.todayIsRest || (!input.todayReached && input.restLeft > 0);
}
