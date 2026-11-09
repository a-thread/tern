import type { NewFoodEntry, Tier } from '@/domain/food/models/foodEntry';
import { amountOf, scaleMeasure, type Measure } from '@/domain/food/models/measure';
import { parseGrams, scaleForGrams, type Macros } from '@/domain/food/models/servings';
import type { SavedMealItem } from '@/domain/saved-meals/models/savedMeals';
import { typedServing } from '@/domain/food/models/servingText';

/** A food typed in by hand: what it's called, its serving, and the numbers as entered. */
export type Homemade = {
  name: string;
  /** "1 bowl", "2 cups": what one serving is. */
  serving: string;
  /** How many servings the numbers are for: 1 for a single serving, 8 for a pot of chili. */
  makes: number;
  /** What one serving weighs, in grams, when known. */
  servingGrams: number | null;
  /** Calories and macros as typed: for one serving, or for the whole batch when it makes more. */
  totals: Macros;
  tier: Tier;
};

/** The words for a serving when none were typed. */
export const DEFAULT_SERVING = '1 serving';

/** One serving's calories and macros: the batch totals shared out, to a tenth. */
export function perServing(h: Pick<Homemade, 'makes' | 'totals'>): Macros {
  const n = Math.max(1, h.makes);
  const share = (v: number) => Math.round((v / n) * 10) / 10;
  return {
    calories: Math.round(h.totals.calories / n),
    protein: share(h.totals.protein),
    carbs: share(h.totals.carbs),
    fat: share(h.totals.fat),
  };
}

/**
 * One serving as a weighed amount, so it can later be changed in oz, g or a cup: "2 cups"
 * weighing 300 g is two cups of 150 g, and "bowl" one bowl. Null without a weight.
 */
export function servingMeasure(
  h: Pick<Homemade, 'serving' | 'servingGrams' | 'makes' | 'totals'>,
): Measure | null {
  if (!h.servingGrams || h.servingGrams <= 0) return null;
  const { portion, quantity } = typedServing(h.serving, h.servingGrams);
  return {
    per100: scaleForGrams(perServing(h), h.servingGrams, 100),
    portions: [portion],
    unit: portion.label,
    quantity,
  };
}

/**
 * One serving as an item, for a meal being built or (with its meal) the log: weighed when
 * its weight is known.
 */
export function homemadeItem(h: Homemade): SavedMealItem {
  const measure = servingMeasure(h);
  const base = { name: h.name.trim(), tier: h.tier };
  // The numbers as entered, not rebuilt from per-100 g (which would round 450 cal to 449).
  if (measure) return { ...base, ...amountOf(measure), ...perServing(h) };
  return {
    ...base,
    servings: 1,
    servingLabel: h.serving.trim() || DEFAULT_SERVING,
    ...perServing(h),
  };
}

/** The log entry for eating one serving. */
export const homemadeEntry = (
  h: Homemade,
  meal: NewFoodEntry['meal'],
): NewFoodEntry => ({ ...homemadeItem(h), meal });

/**
 * The whole batch as one item, to save as a recipe that makes `makes` servings. With a
 * serving weight it keeps a measure for the whole pot ("8 bowls"), so a serving logged from
 * the recipe later can still be changed by the ounce or gram.
 */
export function batchItem(h: Homemade): SavedMealItem {
  const serving = servingMeasure(h);
  return {
    name: h.name.trim(),
    servings: 1,
    servingLabel: 'whole batch',
    ...h.totals,
    tier: h.tier,
    ...(serving ? { measure: scaleMeasure(serving, h.makes) } : {}),
  };
}

/** A calorie or macro figure as typed ("62,5" or "62.5"); 0 when left blank. */
export function typedNutrient(text: string): number {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Keeps only what a number can be typed with, so a stray letter can't turn a figure into 0. */
export const numberChars = (text: string) => text.replace(/[^0-9.,]/g, '');

/** A weight typed in oz or g, as grams; null while it isn't a sensible number. */
export function typedServingGrams(
  text: string,
  gramsPerUnit: number,
): number | null {
  if (!text.trim()) return null;
  const n = parseGrams(text, gramsPerUnit);
  return n === null ? null : Math.round(n * gramsPerUnit * 10) / 10;
}
