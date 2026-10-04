/**
 * How a day went: the goal was reached, some steps, a rest day, or nothing. A
 * frozen day is one that would have broken the streak but was covered by a
 * streak freeze.
 */
export enum DayState {
  Goal = 'goal',
  Partial = 'partial',
  Rest = 'rest',
  Frozen = 'frozen',
  None = 'none',
}
