import { useCallback, useEffect, useState } from 'react';

import { FoodApiError } from '@food/data/sources/http';
import { searchProducts } from '@food/data/sources/openFoodFacts';
import { searchUsda } from '@food/data/sources/usda';
import type { SearchResult } from '@food/data/sources/searchResult';

/** When food search starts looking. */
export class FoodSearch {
  static readonly DEBOUNCE_MS = 400;

  static readonly MIN_CHARS = 2;
}
const CACHE_MAX = 60;

/**
 * One source's search. `results` is what to show: the answer for `query`, or
 * while a newer search runs (or after it failed), the last answer, so the list
 * never empties between keystrokes. `query` says which search they belong to.
 */
export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; results: SearchResult[]; query: string | null }
  | { status: 'done'; results: SearchResult[]; query: string }
  | { status: 'error'; kind: FoodApiError['kind']; results: SearchResult[]; query: string | null };

/** A food database to search: `key` keeps each source's cached queries apart. */
export type SearchSource = {
  key: string;
  search: (query: string, signal?: AbortSignal) => Promise<SearchResult[]>;
};

export const offSource: SearchSource = {
  key: 'off',
  search: (q, signal) => searchProducts(q, signal),
};
/** Open Food Facts without the slow all-languages retry, for when other sources already found something. */
export const offEnglishSource: SearchSource = {
  key: 'off-en',
  search: (q, signal) => searchProducts(q, signal, { fallback: false }),
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

const lastResults = (s: SearchState): { results: SearchResult[]; query: string | null } =>
  s.status === 'idle' ? { results: [], query: null } : { results: s.results, query: s.query };

/**
 * Food search as you type: waits for a pause in typing, needs a couple of
 * characters, and cancels a request that a newer query replaces. Nothing is
 * requested while `enabled` is false or the query is too short. Call it once
 * per source; each keeps its own state, so one failing doesn't hide the other.
 *
 * While you type, the last results stay (status unchanged) and the source only
 * reports `loading` once the pause is over and a request is really running.
 */
export function useFoodSearch(
  query: string,
  enabled = true,
  source: SearchSource = offSource,
) {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const q = query.trim();
  const active = enabled && q.length >= FoodSearch.MIN_CHARS;
  const cacheKey = `${source.key}:${q.toLowerCase()}`;

  useEffect(() => {
    if (!active) {
      setState({ status: 'idle' });
      return;
    }
    const cached = cache.get(cacheKey);
    if (cached) {
      setState({ status: 'done', results: cached, query: q });
      return;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => ({ status: 'loading', ...lastResults(s) }));
      try {
        const results = await source.search(q, ctrl.signal);
        if (ctrl.signal.aborted) return;
        remember(cacheKey, results);
        setState({ status: 'done', results, query: q });
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setState((s) => ({
          status: 'error',
          kind: e instanceof FoodApiError ? e.kind : 'network',
          ...lastResults(s),
        }));
      }
    }, FoodSearch.DEBOUNCE_MS);

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
