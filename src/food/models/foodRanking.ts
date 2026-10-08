import type { SearchResult } from '@food/data/sources/searchResult';
import { allWordsPrefix, normalizeText, wordsOf } from './foodQuery';

/** A food in the one search list, with where it came from. `mine` is your own history. */
export type FoodSource = 'mine' | 'common' | 'usda' | 'off';
export type RankedFood = SearchResult & { from: FoodSource; score: number };

/** How results are scored and merged. */
export class FoodRanking {
  static readonly EXACT = 1000;
  static readonly NAME_PREFIX = 800;
  static readonly NAME_WORDS = 600;
  static readonly WITH_DETAIL = 400;
  static readonly WITH_BRAND = 300;
  static readonly SOURCE_BONUS: Record<FoodSource, number> = { mine: 150, common: 40, usda: 0, off: 0 };
  /** Rows near the top don't move for a late result unless it beats them by this much. */
  static readonly PIN_MARGIN = 300;
  static readonly PINNED_ROWS = 5;
  static readonly LIMIT = 30;
}

/** Every word of the query starts a word of the food's name, detail, brand or aliases. */
export function matchesQuery(r: SearchResult, query: string, aliases: string[] = []): boolean {
  const q = wordsOf(query);
  if (!q.length) return true;
  return allWordsPrefix(q, [
    ...wordsOf(r.name),
    ...wordsOf(r.detail ?? ''),
    ...wordsOf(r.brand ?? ''),
    ...aliases.flatMap(wordsOf),
  ]);
}

/**
 * How well a food answers a query; higher is better. A strong name match beats
 * everything else, then shorter (more general) names, how common the food is
 * and your own history. Packaged rows with missing macros, or no brand, sink.
 */
export function scoreResult(
  query: string,
  r: SearchResult,
  from: FoodSource,
  aliases: string[] = [],
): number {
  const q = wordsOf(query);
  if (!q.length) return 0;
  const nq = normalizeText(query);
  const name = normalizeText(r.name);
  const nameWords = wordsOf(r.name);
  const detailWords = wordsOf(r.detail ?? '');
  const brandWords = wordsOf(r.brand ?? '');
  const aliasWords = aliases.flatMap(wordsOf);

  let score: number;
  if (name === nq || aliases.some((a) => normalizeText(a) === nq)) score = FoodRanking.EXACT;
  else if (name.startsWith(nq)) score = FoodRanking.NAME_PREFIX;
  else if (allWordsPrefix(q, nameWords)) score = FoodRanking.NAME_WORDS + (nameWords[0]?.startsWith(q[0]) ? 50 : 0);
  else if (allWordsPrefix(q, [...nameWords, ...detailWords, ...aliasWords])) score = FoodRanking.WITH_DETAIL;
  else if (allWordsPrefix(q, [...nameWords, ...detailWords, ...brandWords, ...aliasWords])) score = FoodRanking.WITH_BRAND;
  else {
    const all = [...nameWords, ...detailWords, ...brandWords];
    score = (q.filter((w) => all.some((x) => x.startsWith(w))).length / q.length) * 200;
  }

  score -= Math.min(nameWords.length, 8) * 10;
  score += FoodRanking.SOURCE_BONUS[from];
  if (r.rank !== undefined) score += Math.max(0, 100 - r.rank / 30);
  if (r.tier !== null) score += 10;
  if (from === 'off') {
    if (q.some((w) => brandWords.some((b) => b.startsWith(w)))) score += 80;
    if (r.calories > 0 && r.protein === 0 && r.carbs === 0 && r.fat === 0) score -= 150;
    if (!r.brand) score -= 40;
  }
  return score;
}

/** The same food from several places (or listed twice) shows once; the first, best-scored copy wins. */
export function dedupeFoods<T extends SearchResult>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((r) => {
    const key = `${normalizeText(r.name)}|${normalizeText(r.brand ?? '')}|${Math.round(r.calories / 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Scores, sorts and de-duplicates foods from every source into one list. */
export function rankFoods(
  query: string,
  groups: { from: FoodSource; foods: SearchResult[]; aliases?: (r: SearchResult) => string[] }[],
): RankedFood[] {
  const all = groups.flatMap(({ from, foods, aliases }) =>
    foods.map((r) => ({ ...r, from, score: scoreResult(query, r, from, aliases?.(r)) })),
  );
  all.sort((a, b) => b.score - a.score);
  return dedupeFoods(all).slice(0, FoodRanking.LIMIT);
}

/**
 * Folds a fresh ranking into what is already on screen without shuffling it.
 * Rows already shown keep their order; a new row slots in by score, but only
 * passes one of the top rows if it beats it by a clear margin (an exact match
 * arriving late can still rise to the top).
 */
export function stableMerge(shownIds: string[], ranked: RankedFood[]): RankedFood[] {
  const byId = new Map(ranked.map((r) => [r.id, r]));
  const kept = shownIds.map((id) => byId.get(id)).filter((r): r is RankedFood => !!r);
  const keptIds = new Set(kept.map((r) => r.id));
  const out = [...kept];
  for (const r of ranked) {
    if (keptIds.has(r.id)) continue;
    let at = out.length;
    for (let i = 0; i < out.length; i++) {
      const margin = i < FoodRanking.PINNED_ROWS && keptIds.has(out[i].id) ? FoodRanking.PIN_MARGIN : 0;
      if (r.score > out[i].score + margin) {
        at = i;
        break;
      }
    }
    out.splice(at, 0, r);
  }
  return out.slice(0, FoodRanking.LIMIT);
}
