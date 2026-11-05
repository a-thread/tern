import { round1 } from '@shared/utils/number';
import type { Portion, SearchResult } from '../sources/searchResult';
import {
  formatCount,
  parseGrams,
  portionGrams,
  scaleForGrams,
  stepServings,
  Servings,
  type Macros,
} from './servings';
import { isVolumeUnit, VolumeSteps, VolumeUnit, withVolumes } from './volume';

/**
 * How a logged amount was measured, kept with the entry so it can be changed
 * in the same unit later: "3 large eggs" stays eggs when you edit it or log it
 * again, instead of turning into a fixed label.
 */
export type Measure = {
  /** Nutrition per 100 g, so any amount can be worked out from it. */
  per100: Macros;
  /** The household units on offer besides grams, e.g. "large egg" = 50 g. */
  portions: Portion[];
  /** What `quantity` counts: a portion's label (a `VolumeUnit` for a drink by volume), or null for grams. */
  unit: string | null;
  /** How many of `unit` (a weight in grams when `unit` is null). */
  quantity: number;
};

/** How grams step in a stepper, and the least one can log. */
export class GramSteps {
  static readonly STEP = 10;

  static readonly MIN = 5;
}

export const portionOf = (m: Measure): Portion | null =>
  m.unit === null ? null : (m.portions.find((p) => p.label === m.unit) ?? null);

/** What the amount weighs. */
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

/** "egg" → "eggs" when `count` isn't 1. Leaves labels with numbers, brackets or unit abbreviations alone. */
export function pluralize(label: string, count: number): string {
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

/** "eggs" → "egg", "tomatoes" → "tomato", "berries" → "berry". Words that don't look plural are left alone. */
export function singular(word: string): string {
  // Only the endings that really turn into "y" (berries, cherries, candies): cookies and pies just lose the "s".
  if (/(rr|nd)ies$/i.test(word)) return `${word.slice(0, -3)}y`;
  if (/(ch|sh|ss|x|z|o)es$/i.test(word)) return word.slice(0, -2);
  if (/[^s]s$/i.test(word)) return word.slice(0, -1);
  return word;
}

/** A label to show on its own, e.g. a chip: "large egg" → "Large egg". */
export const sentence = (label: string) =>
  label.charAt(0).toUpperCase() + label.slice(1);

/** "2 large eggs (100 g)", or "150 g" when weighed. */
export function measureLabel(m: Measure): string {
  const p = portionOf(m);
  if (!p) return `${formatCount(measureGrams(m))} g`;
  return `${formatCount(m.quantity)} ${pluralize(p.label, m.quantity)} (${measureGrams(m)} g)`;
}

/** Whether the amount is typed rather than counted: a weight in grams, or a volume. */
export const isTypedUnit = (unit: string | null) =>
  unit === null || isVolumeUnit(unit);

/** The amount alone, for a stepper: "2" for two eggs, "150 g" for a weight, "250 ml" for a drink. */
export function quantityText(m: Measure): string {
  if (m.unit === null) return `${formatCount(m.quantity)} g`;
  if (isVolumeUnit(m.unit)) return `${formatCount(m.quantity)} ${m.unit}`;
  return formatCount(m.quantity);
}

/** The entry fields for this amount: one serving of exactly what was eaten, plus the measure itself. */
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

/** One step up or down: a quarter of a portion, ten grams, ten ml or a fluid ounce. */
export function stepMeasure(m: Measure, direction: 1 | -1): Measure {
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
  return {
    ...m,
    quantity: stepServings(m.quantity, direction * Servings.STEP),
  };
}

/** The same amount (by weight) in another unit: a quarter-portion count (fl oz too), or whole grams or ml. */
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

/**
 * Typing an amount: `text` in the volume unit chosen, else in grams, or zero
 * while it isn't a sensible number.
 */
export const typedAmount = (m: Measure, text: string): Measure => ({
  ...m,
  unit: isVolumeUnit(m.unit) ? m.unit : null,
  quantity: parseGrams(text) ?? 0,
});

/** The measure with fl oz and ml on offer when `name` is a drink (entries logged before they were). */
export function withVolumeUnits(m: Measure, name: string): Measure {
  const portions = withVolumes(m.portions, name);
  return portions === m.portions ? m : { ...m, portions };
}

/**
 * Where to start when logging `result`, whose values are for `baseGrams`: the
 * unit and amount used last time if it was logged before, else the first
 * portion (one of it), else the weight the values are for (in ml for a drink).
 * Drinks also get fl oz and ml to choose from.
 */
export function startingMeasure(
  result: SearchResult,
  baseGrams: number,
): Measure {
  const own = result.portions ?? [];
  const portions = withVolumes(own, result.name, result.liquid);
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
  return { ...base, unit: null, quantity: baseGrams };
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

/** A measure read back from storage, or undefined if it isn't a usable one (older entries have none). */
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
