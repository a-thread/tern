/** The daily movement goal in minutes: how it steps, and the range it can take. */
export class MovementGoal {
  /** How the goal stepper moves, up to `BIG_STEP_FROM`. */
  static readonly STEP = 5;

  /** Past an hour the stepper moves faster, so 300 isn't fifty taps away. */
  static readonly BIG_STEP = 15;

  static readonly BIG_STEP_FROM = 60;

  /** Minutes in a day that make it a goal day, until changed in settings. */
  static readonly DEFAULT = 30;

  static readonly MIN = 10;

  static readonly MAX = 300;
}

export const clampMovementGoal = (m: number) =>
  Math.min(Math.max(Math.round(m), MovementGoal.MIN), MovementGoal.MAX);

/** One stepper tap up or down, landing on the next multiple of the step. */
export function stepMovementGoal(current: number, dir: 1 | -1): number {
  const big =
    dir > 0
      ? current >= MovementGoal.BIG_STEP_FROM
      : current > MovementGoal.BIG_STEP_FROM;
  const step = big ? MovementGoal.BIG_STEP : MovementGoal.STEP;
  const next =
    dir > 0
      ? Math.floor(current / step) * step + step
      : Math.ceil(current / step) * step - step;
  return clampMovementGoal(next);
}
