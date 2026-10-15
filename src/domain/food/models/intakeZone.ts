import { type CalorieZone, CalorieZoneLimits } from '../../settings/models/calorieZone';

export class IntakeZones {
  /** The default zone sits this share either side of the calorie target. */
  static readonly DEFAULT_SPREAD = 0.15;
}

const snap = (n: number) =>
  Math.round(n / CalorieZoneLimits.STEP) * CalorieZoneLimits.STEP;

/** A zone around the calorie target, used until the person sets their own. */
export function defaultZone(calorieTarget: number): CalorieZone {
  return {
    min: snap(calorieTarget * (1 - IntakeZones.DEFAULT_SPREAD)),
    max: snap(calorieTarget * (1 + IntakeZones.DEFAULT_SPREAD)),
  };
}

export function resolveZone(
  zone: CalorieZone | null,
  calorieTarget: number,
): CalorieZone {
  return zone ?? defaultZone(calorieTarget);
}

/** Moves one end of a zone by a step, keeping the minimum gap and the limits. */
export function nudgeZone(
  zone: CalorieZone,
  end: 'min' | 'max',
  direction: 1 | -1,
): CalorieZone {
  const delta = direction * CalorieZoneLimits.STEP;
  if (end === 'min') {
    const min = Math.min(
      Math.max(zone.min + delta, CalorieZoneLimits.FLOOR),
      zone.max - CalorieZoneLimits.MIN_GAP,
    );
    return { min, max: zone.max };
  }
  const max = Math.max(
    Math.min(zone.max + delta, CalorieZoneLimits.CEILING),
    zone.min + CalorieZoneLimits.MIN_GAP,
  );
  return { min: zone.min, max };
}

/** Where intake and the zone sit on one shared 0..1 scale, so a bar can draw both. */
export function zoneScale(
  intake: number,
  zone: CalorieZone,
): { fill: number; zoneStart: number; zoneEnd: number } {
  const top = Math.max(zone.max * 1.2, intake * 1.05, 1);
  return {
    fill: Math.min(intake / top, 1),
    zoneStart: zone.min / top,
    zoneEnd: zone.max / top,
  };
}

/** A macro bar's fill, capped at full. Protein as a minimum never "overflows". */
export function macroFill(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.max(current / target, 0), 1);
}

export type ZoneStatus =
  | { kind: 'below'; amount: number }
  | { kind: 'in' }
  | { kind: 'above'; amount: number };

/** Where intake sits against the zone, with how far outside it. Information only. */
export function zoneStatus(intake: number, zone: CalorieZone): ZoneStatus {
  if (intake < zone.min) return { kind: 'below', amount: Math.round(zone.min - intake) };
  if (intake > zone.max) return { kind: 'above', amount: Math.round(intake - zone.max) };
  return { kind: 'in' };
}

/** Where a minimum's target mark sits on its bar, leaving room to go past it. */
export const MINIMUM_MARK = 0.8;

/** Fill for a bar whose target is a minimum: the target sits at MINIMUM_MARK and going past it keeps filling. */
export function minimumFill(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.max((current / target) * MINIMUM_MARK, 0), 1);
}
