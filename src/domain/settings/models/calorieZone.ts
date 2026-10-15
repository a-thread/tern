/** A calorie "target zone" for the intake bar: the range someone aims to land in. */
export type CalorieZone = { min: number; max: number };

/** How far a zone can be nudged, and how tight it can get. */
export class CalorieZoneLimits {
  static readonly STEP = 10;
  static readonly MIN_GAP = 100;
  static readonly FLOOR = 800;
  static readonly CEILING = 6000;
}

export function sanitizeCalorieZone(value: unknown): CalorieZone | null {
  if (!value || typeof value !== 'object') return null;
  const { min, max } = value as Partial<CalorieZone>;
  if (
    typeof min !== 'number' ||
    typeof max !== 'number' ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    max - min < CalorieZoneLimits.MIN_GAP
  ) {
    return null;
  }
  return { min, max };
}
