import { round1 } from '@shared/utils/number';
import type { Portion } from '../sources/searchResult';

/** "100 g" or "1.5 cup (237 g)"; null for "1 bar". */
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

/** Accepts "40,5"; the cap is on weight, so `gramsPerUnit` scales it (176 oz passes, 177 doesn't). */
export function parseGrams(text: string, gramsPerUnit = 1): number | null {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) &&
    n > 0 &&
    n * gramsPerUnit <= TypedLimits.MAX_GRAMS
    ? n
    : null;
}

export class Servings {
  static readonly STEP = 0.25;

  static readonly MIN = 0.25;

  /** A hundred of anything is a slip. */
  static readonly MAX = 100;

  /** The serving size of something with no size of its own, like a share of a cooked batch. */
  static readonly PLAIN = '1 serving';
}

/** "1.5 servings", "2 × 1 cup", or the size alone for one. */
export function servingsText(servings: number, label: string): string {
  if (label.trim().toLowerCase() === Servings.PLAIN)
    return `${formatCount(servings)} ${servings === 1 ? 'serving' : 'servings'}`;
  return servings === 1 ? label : `${formatCount(servings)} × ${label}`;
}

export const stepServings = (value: number, delta: number) =>
  Math.max(Servings.MIN, Math.round((value + delta) * 4) / 4);

/** Kept to a hundredth as typed (only steppers snap to quarters), between MIN and MAX. */
export function typedServings(text: string): number | null {
  const n = parseFloat(text.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(
    Math.max(Math.round(n * 100) / 100, Servings.MIN),
    Servings.MAX,
  );
}

export const formatCount = (n: number) => String(Math.round(n * 100) / 100);

export const portionGrams = (portion: Portion, count: number) =>
  round1(portion.grams * count);

/** The label saved with a logged portion, e.g. "1.5 cup (237 g)". */
export const portionServingLabel = (portion: Portion, count: number) =>
  `${formatCount(count)} ${portion.label} (${portionGrams(portion, count)} g)`;
