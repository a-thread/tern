import { usdaFoodToResult, type UsdaMeasure } from '@food/data/sources/usda';
import type { CommonFood } from '@food/models/commonFoods';
import { cleanPortionLabel, plainness, splitUsdaName } from '@food/models/commonFoodName';
import { portionKind, typicalPortions } from '@food/models/commonFoodPortions';
import { nounFor } from '@food/models/measure';
import { suggestTier } from '@food/models/commonFoodTier';
import { normalizeText, wordsOf } from '@food/models/foodQuery';
import type { Tier } from '@food/models/foodEntry';
import type { Portion } from '@food/data/sources/searchResult';

/**
 * Turns USDA FoodData Central bulk downloads into the common-foods list.
 * Pure, so it can be tested; scripts/buildCommonFoods.ts does the file work.
 */

/** Which USDA data set a food came from. Survey (FNDDS) foods are foods as people eat them, so they win ties. */
export type BulkKind = 'fndds' | 'foundation' | 'sr';
const KIND_ORDER: Record<BulkKind, number> = { fndds: 0, foundation: 1, sr: 2 };

/** A food as the bulk JSON files describe it. */
export type BulkFood = {
  fdcId?: number;
  description?: string;
  foodCategory?: { description?: string };
  wweiaFoodCategory?: { wweiaFoodCategoryDescription?: string };
  foodNutrients?: { nutrient?: { id?: number; number?: string; unitName?: string }; amount?: number }[];
  foodPortions?: (UsdaMeasure & { sequenceNumber?: number })[];
};

/**
 * A hand correction for one food, matched by its cleaned name, and by its
 * detail too when `matchDetail` is given (to pick one of several "Egg" rows).
 */
export type Override = {
  name: string;
  matchDetail?: string;
  rename?: string;
  detail?: string;
  /** Replaces the portions, e.g. every egg size, in the order to offer them (the first is the default). */
  portions?: Portion[];
  aliases?: string[];
  /** Lower is more common; overridden foods come before the rest. */
  rank?: number;
  tier?: Tier | null;
  /** Leave this food out of the list. */
  exclude?: boolean;
  /**
   * Keep only the foods of this name that some override picked: "Egg" becomes
   * just the preparations listed, not every egg row USDA has (dried, frozen…).
   */
  onlyListed?: boolean;
};

export type Candidate = { kind: BulkKind; category: string; food: CommonFood };

const EXCLUDE = /\b(baby ?foods?|infant|toddler|formula|restaurant|fast foods?)\b/i;
// SR Legacy names brands in capitals ("KELLOGG'S"); packaged products come from Open Food Facts instead.
const BRANDED = /\b[A-Z]{3,}(?:'S)?\b/;

export function bulkToCandidate(f: BulkFood | null, kind: BulkKind): Candidate | null {
  // The downloads have the odd null entry.
  if (!f) return null;
  const description = (f.description ?? '').trim();
  if (!description || f.fdcId === undefined) return null;
  const category = f.foodCategory?.description ?? f.wweiaFoodCategory?.wweiaFoodCategoryDescription ?? '';
  if (EXCLUDE.test(description) || EXCLUDE.test(category) || BRANDED.test(description)) return null;

  const r = usdaFoodToResult({
    fdcId: f.fdcId,
    description,
    foodNutrients: (f.foodNutrients ?? []).filter(Boolean).map((n) => ({
      nutrientId: n.nutrient?.id,
      nutrientNumber: n.nutrient?.number,
      unitName: n.nutrient?.unitName,
      value: n.amount,
    })),
    foodPortions: (f.foodPortions ?? []).filter(Boolean).map((p) => ({ ...p, rank: p.rank ?? p.sequenceNumber })),
  });
  if (!r) return null;

  const { name, detail } = splitUsdaName(description);
  // Every portion for now; selectCommonFoods picks the typical ones once it can see
  // the same food's other USDA rows (their sizes too).
  const portions = (r.portions ?? [])
    .map((p) => ({ ...p, label: cleanPortionLabel(p.label) }))
    .filter((p) => p.label);
  return {
    kind,
    category,
    food: {
      id: `fdc-${f.fdcId}`,
      name,
      ...(detail ? { detail } : {}),
      kcal: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      ...(portions.length ? { portions } : {}),
      rank: 0,
      tier: suggestTier(name, detail, category),
    },
  };
}

const wordCount = (s: string) => normalizeText(s).split(' ').filter(Boolean).length;
// Singular words, so "Apples, raw" and "Apple, raw" are the same food.
const sameText = (s: string) => wordsOf(s).join(' ');

/**
 * Picks the list: one food per name and detail, general foods and plain forms
 * before specific ones and variants, hand overrides applied and ranked first, then
 * ranks numbered from 1 and the list capped at `limit`.
 */
export function selectCommonFoods(
  candidates: Candidate[],
  overrides: Override[],
  limit = 3000,
): { foods: CommonFood[]; unmatched: string[] } {
  // One number for "how likely is this the food someone means": survey foods (as people eat
  // them) before reference data, short general names before long ones, plain forms before
  // variants. A single score rather than tie-breaks, so the cap doesn't keep only one-word names.
  const commonness = (c: Candidate) =>
    KIND_ORDER[c.kind] * 2 + (wordCount(c.food.name) - 1) * 2 + plainness(c.food.detail);
  const sorted = [...candidates].sort(
    (a, b) =>
      commonness(a) - commonness(b) ||
      (a.food.detail ?? '').length - (b.food.detail ?? '').length,
  );
  // Sizes and single items shared between the raw rows of the same food: the survey row
  // for "Apple, raw" has no sizes, but SR Legacy's apples do. Only raw foods share, since
  // "Bread" or "Potato" rows are different breads and dishes, not one food.
  const raw = (detail?: string) => /\braw\b/i.test(detail ?? '');
  const poolKey = (f: CommonFood) => sameText(f.name);
  const pool = new Map<string, Portion[]>();
  for (const c of sorted) {
    if (!raw(c.food.detail)) continue;
    const items = (c.food.portions ?? []).filter((p) => {
      const k = portionKind(p.label);
      return k === 'size' || k === 'count';
    });
    pool.set(poolKey(c.food), [...(pool.get(poolKey(c.food)) ?? []), ...items]);
  }

  const seen = new Set<string>();
  let foods = sorted
    .filter((c) => {
      const key = `${sameText(c.food.name)}|${sameText(c.food.detail ?? '')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((c) => {
      const portions = typicalPortions(
        [...(c.food.portions ?? []), ...(raw(c.food.detail) ? (pool.get(poolKey(c.food)) ?? []) : [])],
        c.food.name,
        nounFor(c.food.name),
      );
      return { ...c.food, portions: portions.length ? portions : undefined };
    });

  const unmatched: string[] = [];
  const ranked = new Map<string, number>();
  const picked = new Set<string>();
  const onlyListed = new Set(overrides.filter((o) => o.onlyListed).map((o) => sameText(o.name)));
  for (const o of overrides) {
    const i = foods.findIndex(
      (f) =>
        sameText(f.name) === sameText(o.name) &&
        (o.matchDetail === undefined || sameText(f.detail ?? '') === sameText(o.matchDetail)),
    );
    if (i < 0) {
      unmatched.push(o.matchDetail !== undefined ? `${o.name} (${o.matchDetail})` : o.name);
      continue;
    }
    if (o.exclude) {
      foods.splice(i, 1);
      continue;
    }
    const f = foods[i];
    foods[i] = {
      ...f,
      ...(o.rename ? { name: o.rename } : {}),
      // An empty detail removes it ("Scrambled egg" needs none).
      ...(o.detail !== undefined ? { detail: o.detail || undefined } : {}),
      ...(o.aliases ? { aliases: o.aliases } : {}),
      ...(o.portions ? { portions: o.portions } : {}),
      ...(o.tier !== undefined ? { tier: o.tier } : {}),
    };
    picked.add(f.id);
    if (o.rank !== undefined) ranked.set(f.id, o.rank);
  }
  foods = foods.filter((f) => picked.has(f.id) || !onlyListed.has(sameText(f.name)));

  foods = [
    ...foods.filter((f) => ranked.has(f.id)).sort((a, b) => ranked.get(a.id)! - ranked.get(b.id)!),
    ...foods.filter((f) => !ranked.has(f.id)),
  ]
    .slice(0, limit)
    .map((f, i) => ({ ...f, rank: i + 1 }));

  return { foods, unmatched };
}
