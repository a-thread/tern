import { round1 } from '@shared/utils/number';
import type { Portion } from '../sources/searchResult';

/**
 * The grams in a serving label: "100 g", or a portion label that ends in its
 * weight like "1.5 cup (237 g)". Null for "1 bar", "1 bowl" and the like.
 */
export function gramsOf(label: string): number | null {
  const m =
    /^\s*(\d+(?:[.,]\d+)?)\s*g\s*$/i.exec(label) ??
    /\((\d+(?:[.,]\d+)?)\s*g\)\s*$/i.exec(label);
  if (!m) return null;
  const g = parseFloat(m[1].replace(',', '.'));
  return g > 0 ? g : null;
}

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** Nutrition for `grams` of a food whose values are given for `baseGrams`. */
export function scaleForGrams(
  per: Macros,
  baseGrams: number,
  grams: number,
): Macros {
  const f = grams / baseGrams;
  return {
    calories: Math.round(per.calories * f),
    protein: round1(per.protein * f),
    carbs: round1(per.carbs * f),
    fat: round1(per.fat * f),
  };
}

/** The most one typed amount can weigh, whatever unit it is typed in. */
export class TypedLimits {
  static readonly MAX_GRAMS = 5000;
}

/**
 * Parses a typed amount ("40", "40.5", "40,5"); null unless it is sensible.
 * The cap is on what it weighs: `gramsPerUnit` is what one of the unit typed
 * in weighs (1 for grams), so 176 oz passes and 177 oz doesn't.
 */
export function parseGrams(text: string, gramsPerUnit = 1): number | null {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) &&
    n > 0 &&
    n * gramsPerUnit <= TypedLimits.MAX_GRAMS
    ? n
    : null;
}

/** How servings step up and down. */
export class Servings {
  /** Servings move in quarters: ¼, ½, ¾, 1, 1¼ … and never below a quarter. */
  static readonly STEP = 0.25;

  static readonly MIN = 0.25;

  /** The serving size of something with no size of its own, like a share of a cooked batch. */
  static readonly PLAIN = '1 serving';
}

/**
 * How much was had, in words: "1.5 servings" when a serving is just a serving, "2 × 1 cup"
 * when it has a size, and the size alone for one of it.
 */
export function servingsText(servings: number, label: string): string {
  if (label.trim().toLowerCase() === Servings.PLAIN)
    return `${formatCount(servings)} ${servings === 1 ? 'serving' : 'servings'}`;
  return servings === 1 ? label : `${formatCount(servings)} × ${label}`;
}

/** `value` moved by `delta` (usually ±SERVING_STEP), snapped to a quarter, floor MIN_SERVINGS. */
export const stepServings = (value: number, delta: number) =>
  Math.max(Servings.MIN, Math.round((value + delta) * 4) / 4);

/** "1", "1.5", "0.5": a count without a trailing ".0". */
export const formatCount = (n: number) => String(Math.round(n * 100) / 100);

/** What `count` of a portion weighs, to a tenth of a gram. */
export const portionGrams = (portion: Portion, count: number) =>
  round1(portion.grams * count);

/** The label saved with a logged portion, e.g. "1.5 cup (237 g)". */
export const portionServingLabel = (portion: Portion, count: number) =>
  `${formatCount(count)} ${portion.label} (${portionGrams(portion, count)} g)`;
