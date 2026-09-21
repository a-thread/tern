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


const ML_PER_FL_OZ = 29.5735295625;

/** Water is always stored in US fluid ounces; millilitres are a display choice. */
export const ozToMl = (oz: number) => oz * ML_PER_FL_OZ;
export const mlToOz = (ml: number) => ml / ML_PER_FL_OZ;

/** Stored ounces rounded to the database's 0.01 precision. */
export const roundOz = (oz: number) => Math.round(oz * 100) / 100;

export const volumeUnitLabel = (units: Units) => (units === 'imperial' ? 'oz' : 'ml');

/**
 * Stored ounces as a whole number in the user's unit. Millilitres are rounded to
 * the nearest 10, so a drink entered as 250 ml (stored as 8.45 oz) reads 250 ml again.
 */
export const toDisplayVolume = (oz: number, units: Units): number =>
  units === 'imperial' ? Math.round(oz) : Math.round(ozToMl(oz) / 10) * 10;

/** A number in the user's unit back to stored ounces. */
export const fromDisplayVolume = (value: number, units: Units): number =>
  roundOz(units === 'imperial' ? value : mlToOz(value));

/** e.g. "64 oz" or "1,890 ml", from stored ounces. */
export function formatVolume(oz: number, units: Units): string {
  return `${toDisplayVolume(oz, units).toLocaleString('en-US')} ${volumeUnitLabel(units)}`;
}

/** The quick-add drink sizes, in stored ounces: 8 / 12 / 16 oz, or 250 / 350 / 500 ml. */
export const quickWaterOz = (units: Units): number[] =>
  units === 'imperial' ? [8, 12, 16] : [250, 350, 500].map((ml) => fromDisplayVolume(ml, 'metric'));

/**
 * The daily goal one step up or down (`direction` 1 or -1): 8 oz at a time, or 250 ml
 * at a time from the nearest 250 ml, so a metric goal lands on tidy numbers.
 */
export function stepWaterGoal(oz: number, direction: 1 | -1, units: Units): number {
  if (units === 'imperial') return Math.round(oz) + direction * 8;
  const ml = Math.round(ozToMl(oz) / 250) * 250 + direction * 250;
  return fromDisplayVolume(ml, 'metric');
}
