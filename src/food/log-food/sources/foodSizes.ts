import { FoodSource } from '@/domain/food/models/foodSource';
import { getUsdaPortions } from '@/domain/food/sources/usda';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import { getProductPortions } from './openFoodFacts';

/** The household sizes a food's details add: its portions, and whether it is poured. */
export type Sizes = Pick<SearchResult, 'portions' | 'liquid'>;

// Sizes already fetched this session (null: the food has none), and requests on their way,
// so the search list and the details screen share one request per food.
const fetched = new Map<string, Sizes | null>();
const pending = new Map<string, Promise<Sizes | null>>();

/** Whether a food found by searching arrived without its sizes, which its details have. */
export const needsSizes = (r: SearchResult) =>
  !r.portions?.length &&
  !r.last &&
  (r.source === FoodSource.Usda || r.source === FoodSource.Off);

/** Whether the sizes of this food have been asked for and answered. */
export const sizesKnown = (r: SearchResult) =>
  !needsSizes(r) || fetched.has(r.id);

/** The food with any sizes fetched for it filled in. */
export function withSizes(r: SearchResult): SearchResult {
  const sizes = needsSizes(r) ? fetched.get(r.id) : null;
  return sizes?.portions?.length ? { ...r, ...sizes } : r;
}

/**
 * Fetches a food's sizes once: USDA's Foundation and SR Legacy foods and Open Food Facts
 * products come from search without them. Resolves to null when there are none; a failure
 * isn't remembered, so the next look tries again.
 */
export function loadSizes(r: SearchResult): Promise<Sizes | null> {
  if (!needsSizes(r)) return Promise.resolve(null);
  if (fetched.has(r.id)) return Promise.resolve(fetched.get(r.id) ?? null);
  const waiting = pending.get(r.id);
  if (waiting) return waiting;
  const request = (
    r.source === FoodSource.Usda
      ? getUsdaPortions(r.id).then((portions): Sizes => ({ portions }))
      : getProductPortions(r.id)
  )
    .then((s) => {
      const found = s.portions?.length ? s : null;
      fetched.set(r.id, found);
      return found;
    })
    .catch(() => null)
    .finally(() => pending.delete(r.id));
  pending.set(r.id, request);
  return request;
}

/** Forgets every fetched size (used by tests). */
export function clearSizes() {
  fetched.clear();
  pending.clear();
}
