/** The daily water goal in ounces: its default and the range it can take. */
export class WaterGoal {
  static readonly DEFAULT_OZ = 64;

  static readonly MIN_OZ = 16;

  static readonly MAX_OZ = 200;
}

/** Keeps a goal within what makes sense. */
export const clampWaterGoal = (oz: number) =>
  Math.min(Math.max(Math.round(oz * 100) / 100, WaterGoal.MIN_OZ), WaterGoal.MAX_OZ);
