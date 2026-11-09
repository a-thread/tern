import { FoodSource } from '@/domain/food/models/foodSource';
import { hasSizes } from '@/domain/food/models/foodRanking';
import { getUsdaPortions } from '@/domain/food/sources/usda';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { getProductPortions } from './openFoodFacts';

/** The household sizes a food's details add: its portions, and whether it is poured. */
export type Sizes = Pick<SearchResult, 'portions' | 'liquid'>;

// Sizes already fetched this session (null: the food has none), and requests on their way,
// so the search list and the details screen share one request per food. Keyed by the
// database id the sizes come from.
const fetched = new Map<string, Sizes | null>();
const pending = new Map<string, Promise<Sizes | null>>();
// Requests that failed this session: the list stops waiting on them; opening the food retries.
const failed = new Set<string>();

/**
 * Where a food's sizes can be fetched from: a USDA or Open Food Facts food itself, or for
 * a food you logged before it had sizes, its database copy (`sizesFrom`).
 */
function sourceOf(r: SearchResult): { id: string; source: FoodSource } | null {
  if (r.sizesFrom) return r.sizesFrom;
  if (r.last) return null;
  return r.source === FoodSource.Usda || r.source === FoodSource.Off
    ? { id: r.id, source: r.source }
    : null;
}

/** Whether a food arrived without sizes of its own that its database details have. */
export const needsSizes = (r: SearchResult) =>
  !hasSizes(r) && sourceOf(r) !== null;

const idOf = (r: SearchResult) => sourceOf(r)?.id ?? r.id;

/** Whether the sizes of this food have been asked for and answered. */
export const sizesKnown = (r: SearchResult) =>
  !needsSizes(r) || fetched.has(idOf(r));

/** Whether asking for this food's sizes is over: answered, or failed this session. */
export const sizesSettled = (r: SearchResult) =>
  sizesKnown(r) || failed.has(idOf(r));

/**
 * The food with any sizes fetched for it filled in, ahead of what it had ("packet" before
 * the oz and lb of a food you logged by weight).
 */
export function withSizes(r: SearchResult): SearchResult {
  const sizes = needsSizes(r) ? fetched.get(idOf(r)) : null;
  if (!sizes?.portions?.length) return r;
  const had = r.portions ?? [];
  const portions = [
    ...sizes.portions,
    ...had.filter((p) => !sizes.portions?.some((s) => s.label === p.label)),
  ];
  return { ...r, portions, liquid: r.liquid || sizes.liquid };
}

/**
 * Fetches a food's sizes once: USDA's Foundation and SR Legacy foods and Open Food Facts
 * products come from search without them. Resolves to null when there are none; a failure
 * is noted, so the list stops waiting, and the next request tries again.
 */
export function loadSizes(r: SearchResult): Promise<Sizes | null> {
  const from = needsSizes(r) ? sourceOf(r) : null;
  if (!from) return Promise.resolve(null);
  if (fetched.has(from.id)) return Promise.resolve(fetched.get(from.id) ?? null);
  const waiting = pending.get(from.id);
  if (waiting) return waiting;
  failed.delete(from.id);
  const request = (
    from.source === FoodSource.Usda
      ? getUsdaPortions(from.id).then((portions): Sizes => ({ portions }))
      : getProductPortions(from.id)
  )
    .then((s) => {
      const found = s.portions?.length ? s : null;
      fetched.set(from.id, found);
      return found;
    })
    .catch(() => {
      failed.add(from.id);
      return null;
    })
    .finally(() => pending.delete(from.id));
  pending.set(from.id, request);
  return request;
}

/** Forgets every fetched size (used by tests). */
export function clearSizes() {
  fetched.clear();
  pending.clear();
  failed.clear();
}
