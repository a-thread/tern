import { Units } from '@shared/utils/units';
import type { Portion } from '../sources/searchResult';

/**
 * Ounces and pounds, offered for every food besides grams. Each is stored as a
 * portion like any other ("oz" = 28.35 g), so an amount in ounces is still a
 * weight underneath and older app versions read it as a plain portion.
 */
export enum WeightUnit {
  Oz = 'oz',
  Lb = 'lb',
}

/** How weights step in a stepper, and the least one can log. */
export class WeightSteps {
  static readonly OZ_STEP = 1;

  static readonly OZ_MIN = 0.5;

  static readonly LB_STEP = 0.25;

  static readonly LB_MIN = 0.25;
}

const GRAMS: Record<WeightUnit, number> = {
  [WeightUnit.Oz]: 28.35,
  [WeightUnit.Lb]: 453.6,
};

/** What one of a weight unit weighs in grams. */
export const weightGrams = (unit: WeightUnit) => GRAMS[unit];

export const isWeightUnit = (unit: string | null): unit is WeightUnit =>
  unit === WeightUnit.Oz || unit === WeightUnit.Lb;

/**
 * What an amount weighs, in the person's own units: "1.2 oz" on Imperial, "35 g" on
 * Metric. `typed` is the unit an amount is typed in (null for grams), or undefined when it is
 * counted ("2 packets"). Null when the typed unit is already a weight in their units.
 */
export function weightNote(
  grams: number,
  units: Units,
  typed?: string | null,
): string | null {
  const imperial = units === Units.Imperial;
  if (typed !== undefined && (imperial ? isWeightUnit(typed) : typed === null))
    return null;
  return imperial
    ? `${Math.round((grams / GRAMS[WeightUnit.Oz]) * 10) / 10} oz`
    : `${Math.round(grams * 10) / 10} g`;
}

/** The portions with ounces and pounds added, unless the food already has them. */
export function withWeights(portions: Portion[]): Portion[] {
  const added = Object.values(WeightUnit)
    .filter((unit) => !portions.some((p) => p.label === unit))
    .map((unit) => ({ label: unit, grams: GRAMS[unit] }));
  return added.length ? [...portions, ...added] : portions;
}
