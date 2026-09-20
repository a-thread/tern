import { useCallback, useEffect, useState } from 'react';

import { FoodApiError } from './http';
import { searchProducts } from './openFoodFacts';
import { searchUsda } from './usda';
import type { SearchResult } from './searchData';

export const SEARCH_DEBOUNCE_MS = 400;
export const SEARCH_MIN_CHARS = 2;
const CACHE_MAX = 60;

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; results: SearchResult[] }
  | { status: 'error'; kind: FoodApiError['kind'] };

/** A food database to search: `key` keeps each source's cached queries apart. */
export type SearchSource = {
  key: string;
  search: (query: string, signal?: AbortSignal) => Promise<SearchResult[]>;
};

export const offSource: SearchSource = {
  key: 'off',
  search: (q, signal) => searchProducts(q, signal),
};
export const usdaSource: SearchSource = {
  key: 'usda',
  search: (q, signal) => searchUsda(q, signal),
};

// Recent queries, so going back and forth doesn't re-hit the network.
const cache = new Map<string, SearchResult[]>();
const remember = (k: string, v: SearchResult[]) => {
  cache.delete(k);
  cache.set(k, v);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
};

/** Clears remembered searches (used by tests). */
export const clearSearchCache = () => cache.clear();

/**
 * Food search as you type: waits for a pause in typing, needs a couple of
 * characters, and cancels a request that a newer query replaces. Nothing is
 * requested while `enabled` is false or the query is too short. Call it once
 * per source; each keeps its own state, so one failing doesn't hide the other.
 */
export function useFoodSearch(
  query: string,
  enabled = true,
  source: SearchSource = offSource,
) {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const q = query.trim();
  const active = enabled && q.length >= SEARCH_MIN_CHARS;
  const cacheKey = `${source.key}:${q.toLowerCase()}`;

  useEffect(() => {
    if (!active) {
      setState({ status: 'idle' });
      return;
    }
    const cached = cache.get(cacheKey);
    if (cached) {
      setState({ status: 'done', results: cached });
      return;
    }

    setState({ status: 'loading' });
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const results = await source.search(q, ctrl.signal);
        if (ctrl.signal.aborted) return;
        remember(cacheKey, results);
        setState({ status: 'done', results });
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setState({ status: 'error', kind: e instanceof FoodApiError ? e.kind : 'network' });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // `source` is a module-level constant per database.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, q, cacheKey, attempt]);

  const retry = useCallback(() => {
    cache.delete(cacheKey);
    setAttempt((n) => n + 1);
  }, [cacheKey]);

  return { state, retry };
}
