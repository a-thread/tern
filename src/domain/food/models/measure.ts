import { round1 } from '@shared/utils/number';
import { Units } from '@shared/utils/units';
import type { Portion, SearchResult } from '../sources/searchResult';
import {
  formatCount,
  parseGrams,
  portionGrams,
  scaleForGrams,
  Servings,
  type Macros,
} from './servings';
import {
  withHouseholdVolumes,
  isVolumeUnit,
  VolumeSteps,
  VolumeUnit,
  withVolumes,
} from './volume';
import { isWeightUnit, WeightSteps, WeightUnit, withWeights } from './weight';

/** Kept with the entry so an edit stays in the same unit ("3 large eggs" stays eggs). */
export type Measure = {
  per100: Macros;
  portions: Portion[];
  /** A portion label, a typed `VolumeUnit`/`WeightUnit`, or null for grams. */
  unit: string | null;
  quantity: number;
};

export class GramSteps {
  static readonly STEP = 10;

  static readonly MIN = 5;
}

export const portionOf = (m: Measure): Portion | null =>
  m.unit === null ? null : (m.portions.find((p) => p.label === m.unit) ?? null);

export const measureGrams = (m: Measure): number => {
  const p = portionOf(m);
  return p ? portionGrams(p, m.quantity) : round1(m.quantity);
};

// Words that are already a unit, so adding an "s" would be wrong ("tbsps").
const UNIT_ABBREVIATIONS = new Set([
  'g',
  'kg',
  'mg',
  'oz',
  'lb',
  'lbs',
  'ml',
  'l',
  'tsp',
  'tbsp',
  'fl',
]);

/** Leaves labels with numbers, brackets or unit abbreviations alone. */
export function pluralize(label: string, count: number): string {
  // "cup, chopped" → "cups, chopped": the unit before the comma takes the plural.
  const comma = label.indexOf(',');
  if (comma > 0)
    return `${pluralize(label.slice(0, comma), count)}${label.slice(comma)}`;
  if (count === 1 || !/^[a-z][a-z -]*$/i.test(label)) return label;
  const words = label.split(' ');
  const last = words[words.length - 1];
  if (UNIT_ABBREVIATIONS.has(last.toLowerCase()) || last.length < 2)
    return label;
  let plural: string;
  if (/(s|x|z|ch|sh)$/i.test(last)) plural = `${last}es`;
  else if (/[^aeiou]y$/i.test(last)) plural = `${last.slice(0, -1)}ies`;
  else plural = `${last}s`;
  return [...words.slice(0, -1), plural].join(' ');
}

/** "tomatoes" → "tomato", "berries" → "berry". */
export function singular(word: string): string {
  // Only the endings that really turn into "y" (berries, cherries, candies): cookies and pies just lose the "s".
  if (/(rr|nd)ies$/i.test(word)) return `${word.slice(0, -3)}y`;
  if (/(ch|sh|ss|x|z|o)es$/i.test(word)) return word.slice(0, -2);
  if (/[^s]s$/i.test(word)) return word.slice(0, -1);
  return word;
}

export const sentence = (label: string) =>
  label.charAt(0).toUpperCase() + label.slice(1);

/** "2 large eggs (100 g)", or "150 g" when weighed. */
export function measureLabel(m: Measure): string {
  const p = portionOf(m);
  if (!p) return `${formatCount(measureGrams(m))} g`;
  return `${formatCount(m.quantity)} ${pluralize(p.label, m.quantity)} (${measureGrams(m)} g)`;
}

export const isTypedUnit = (unit: string | null) =>
  unit === null || isVolumeUnit(unit) || isWeightUnit(unit);

/** The amount alone, for a stepper: "2" for two eggs, "150 g" for a weight, "250 ml" for a drink. */
export function quantityText(m: Measure): string {
  if (m.unit === null) return `${formatCount(m.quantity)} g`;
  if (isTypedUnit(m.unit)) return `${formatCount(m.quantity)} ${m.unit}`;
  return formatCount(m.quantity);
}

/** The amount in words, with its unit: "2 packets", "0.5 cup", "6 oz", "150 g". */
export function amountText(m: Measure): string {
  if (isTypedUnit(m.unit)) return quantityText(m);
  return `${formatCount(m.quantity)} ${pluralize(m.unit ?? '', m.quantity)}`;
}

/** One serving of exactly what was eaten, plus the measure. */
export function amountOf(m: Measure) {
  return {
    servings: 1,
    servingLabel: measureLabel(m),
    ...scaleForGrams(m.per100, 100, measureGrams(m)),
    measure: m,
  };
}

const volumeStep = (unit: VolumeUnit) =>
  unit === VolumeUnit.Ml
    ? { step: VolumeSteps.ML_STEP, min: VolumeSteps.ML_MIN }
    : { step: VolumeSteps.FL_OZ_STEP, min: VolumeSteps.FL_OZ_MIN };

const weightStep = (unit: WeightUnit) =>
  unit === WeightUnit.Oz
    ? { step: WeightSteps.OZ_STEP, min: WeightSteps.OZ_MIN, digits: 1 }
    : { step: WeightSteps.LB_STEP, min: WeightSteps.LB_MIN, digits: 2 };

const roundTo = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

/** A quarter of a count, 10 g, 1 oz, ¼ lb, 10 ml or 1 fl oz. */
export function stepMeasure(m: Measure, direction: 1 | -1): Measure {
  if (isWeightUnit(m.unit)) {
    const { step, min, digits } = weightStep(m.unit);
    return {
      ...m,
      quantity: Math.max(min, roundTo(m.quantity + direction * step, digits)),
    };
  }
  if (isVolumeUnit(m.unit)) {
    const { step, min } = volumeStep(m.unit);
    return {
      ...m,
      quantity: Math.max(min, Math.round(m.quantity + direction * step)),
    };
  }
  if (m.unit === null) {
    return {
      ...m,
      quantity: Math.max(
        GramSteps.MIN,
        Math.round(m.quantity + direction * GramSteps.STEP),
      ),
    };
  }
  // Snaps to the next quarter; an amount under a quarter (from a scaled meal) stays put.
  const step = Servings.STEP;
  const at = m.quantity / step;
  const next =
    (direction > 0 ? Math.floor(at + 1e-9) + 1 : Math.ceil(at - 1e-9) - 1) *
    step;
  return {
    ...m,
    quantity:
      next >= step ? Math.round(next * 100) / 100 : Math.min(m.quantity, step),
  };
}

/** Same weight in another unit, rounded to quarters (counts, fl oz) or whole g/ml. */
export function switchUnit(m: Measure, unit: string | null): Measure {
  if (unit === m.unit) return m;
  const grams = measureGrams(m);
  const target =
    unit === null ? null : (m.portions.find((p) => p.label === unit) ?? null);
  if (!target)
    return {
      ...m,
      unit: null,
      quantity: Math.max(GramSteps.MIN, Math.round(grams)),
    };
  if (target.label === VolumeUnit.Ml)
    return {
      ...m,
      unit: target.label,
      quantity: Math.max(VolumeSteps.ML_MIN, Math.round(grams / target.grams)),
    };
  if (isWeightUnit(target.label)) {
    const { min, digits } = weightStep(target.label);
    return {
      ...m,
      unit: target.label,
      quantity: Math.max(min, roundTo(grams / target.grams, digits)),
    };
  }
  return {
    ...m,
    unit: target.label,
    quantity: Math.max(
      Servings.MIN,
      Math.round((grams / target.grams) * 4) / 4,
    ),
  };
}

/** A measure scaled by `factor` (half a saved meal), rounded to hundredths. */
export const scaleMeasure = (m: Measure, factor: number): Measure => ({
  ...m,
  quantity: Math.max(0.01, Math.round(m.quantity * factor * 100) / 100),
});

/** Zero while not a sensible number; capped by weight. Oz keep a tenth, lb a hundredth. */
export function typedAmount(m: Measure, text: string): Measure {
  const unit = isTypedUnit(m.unit) ? m.unit : null;
  const weight = isWeightUnit(unit) ? portionOf({ ...m, unit }) : null;
  const n = parseGrams(text, weight?.grams);
  const digits = isWeightUnit(unit) ? weightStep(unit).digits : 2;
  return { ...m, unit, quantity: n === null ? 0 : roundTo(n, digits) };
}

/** Adds oz/lb, household volumes and drink volumes (older entries lack them). */
export function withTypedUnits(m: Measure, name: string): Measure {
  const portions = withWeights(
    withVolumes(withHouseholdVolumes(m.portions, name), name),
  );
  return portions.length === m.portions.length ? m : { ...m, portions };
}

/** Last time's unit and amount, else one of the first portion, else `baseGrams` in a fitting unit. */
export function startingMeasure(
  result: SearchResult,
  baseGrams: number,
  units: Units,
): Measure {
  const own = withHouseholdVolumes(result.portions ?? [], result.name);
  const portions = withWeights(withVolumes(own, result.name, result.liquid));
  const base = { per100: scaleForGrams(result, baseGrams, 100), portions };
  const last = result.last;
  if (last) {
    if (last.unit === null)
      return { ...base, unit: null, quantity: last.quantity };
    if (portions.some((p) => p.label === last.unit))
      return { ...base, unit: last.unit, quantity: last.quantity };
  }
  if (own.length) return { ...base, unit: own[0].label, quantity: 1 };
  const ml = portions.find((p) => p.label === VolumeUnit.Ml);
  if (ml)
    return {
      ...base,
      unit: VolumeUnit.Ml,
      quantity: Math.round(baseGrams / ml.grams),
    };
  const oz = portions.find((p) => p.label === WeightUnit.Oz);
  if (units === Units.Imperial && oz)
    return {
      ...base,
      unit: WeightUnit.Oz,
      quantity: Math.max(WeightSteps.OZ_MIN, roundTo(baseGrams / oz.grams, 1)),
    };
  return { ...base, unit: null, quantity: baseGrams };
}

/** Puts late-arriving sizes first, keeping the chosen unit and amount. */
export function addPortions(m: Measure, extra: Portion[]): Measure {
  const fresh = extra.filter(
    (p) => !m.portions.some((q) => q.label === p.label),
  );
  return fresh.length ? { ...m, portions: [...fresh, ...m.portions] } : m;
}

const finite = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);
const macros = (v: unknown): Macros | null => {
  const m = v as Partial<Record<keyof Macros, unknown>> | null;
  return m &&
    finite(m.calories) &&
    finite(m.protein) &&
    finite(m.carbs) &&
    finite(m.fat)
    ? { calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat }
    : null;
};

/** Undefined when unusable (older entries have none). */
export function parseMeasure(raw: unknown): Measure | undefined {
  const r = raw as Partial<Measure> | null | undefined;
  if (!r || typeof r !== 'object') return undefined;
  const per100 = macros(r.per100);
  if (!per100 || !finite(r.quantity) || r.quantity <= 0) return undefined;
  const portions = Array.isArray(r.portions)
    ? r.portions.filter(
        (p): p is Portion =>
          typeof p?.label === 'string' && finite(p.grams) && p.grams > 0,
      )
    : [];
  const unit = typeof r.unit === 'string' ? r.unit : null;
  if (unit !== null && !portions.some((p) => p.label === unit))
    return undefined;
  return { per100, portions, unit, quantity: r.quantity };
}

/** The first word(s) of a USDA food name as a noun: "Egg, whole, raw" → "egg", "Apples, raw" → "apple". */
export function nounFor(foodName: string): string | null {
  const first = foodName.split(',')[0].trim().toLowerCase();
  const words = first.split(/\s+/);
  if (!first || words.length > 2 || !/^[a-z ]+$/.test(first)) return null;
  return [...words.slice(0, -1), singular(words[words.length - 1])].join(' ');
}
