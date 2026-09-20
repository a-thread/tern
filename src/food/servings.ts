import type { Portion } from './searchData';

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

type Macros = { calories: number; protein: number; carbs: number; fat: number };

/** Nutrition for `grams` of a food whose values are given for `baseGrams`. */
export function scaleForGrams(per: Macros, baseGrams: number, grams: number): Macros {
  const f = grams / baseGrams;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    calories: Math.round(per.calories * f),
    protein: r1(per.protein * f),
    carbs: r1(per.carbs * f),
    fat: r1(per.fat * f),
  };
}

/** Parses a typed amount ("40", "40.5", "40,5"); null unless it is a sensible weight. */
export function parseGrams(text: string): number | null {
  const g = parseFloat(text.replace(',', '.'));
  return Number.isFinite(g) && g > 0 && g <= 5000 ? g : null;
}

/** Servings move in quarters: ¼, ½, ¾, 1, 1¼ … and never below a quarter. */
export const SERVING_STEP = 0.25;
export const MIN_SERVINGS = 0.25;

/** `value` moved by `delta` (usually ±SERVING_STEP), snapped to a quarter, floor MIN_SERVINGS. */
export const stepServings = (value: number, delta: number) =>
  Math.max(MIN_SERVINGS, Math.round((value + delta) * 4) / 4);

/** "1", "1.5", "0.5": a count without a trailing ".0". */
export const formatCount = (n: number) => String(Math.round(n * 100) / 100);

/** What `count` of a portion weighs, to a tenth of a gram. */
export const portionGrams = (portion: Portion, count: number) =>
  Math.round(portion.grams * count * 10) / 10;

/** The label saved with a logged portion, e.g. "1.5 cup (237 g)". */
export const portionServingLabel = (portion: Portion, count: number) =>
  `${formatCount(count)} ${portion.label} (${portionGrams(portion, count)} g)`;
