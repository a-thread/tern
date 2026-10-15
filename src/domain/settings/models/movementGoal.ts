/** The daily movement goal in minutes: how it steps, and the range it can take. */
export class MovementGoal {
  /** How the goal stepper moves. */
  static readonly STEP = 5;

  /** Minutes in a day that make it a goal day, until changed in settings. */
  static readonly DEFAULT = 30;

  static readonly MIN = 10;

  static readonly MAX = 120;
}

export const clampMovementGoal = (m: number) =>
  Math.min(Math.max(Math.round(m), MovementGoal.MIN), MovementGoal.MAX);
