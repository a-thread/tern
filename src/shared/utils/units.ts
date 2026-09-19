export type Units = 'imperial' | 'metric';

const LB_PER_KG = 2.20462262185;

/** Weight is always stored in pounds; kilograms are a display choice. */
export const kgToLb = (kg: number) => kg * LB_PER_KG;
export const lbToKg = (lb: number) => lb / LB_PER_KG;

export const weightUnitLabel = (units: Units) =>
  units === 'imperial' ? 'lb' : 'kg';

/** Stored pounds as a number in the user's unit. */
export function toDisplayWeight(lb: number, units: Units): number {
  return units === 'imperial' ? lb : lbToKg(lb);
}

/** A number in the user's unit back to stored pounds, at the database's 0.01 precision. */
export function fromDisplayWeight(value: number, units: Units): number {
  const lb = units === 'imperial' ? value : kgToLb(value);
  return Math.round(lb * 100) / 100;
}

/** e.g. "172.4 lb" or "78.2 kg", from stored pounds. */
export function formatWeight(lb: number, units: Units, digits = 1): string {
  return `${toDisplayWeight(lb, units).toFixed(digits)} ${weightUnitLabel(units)}`;
}
