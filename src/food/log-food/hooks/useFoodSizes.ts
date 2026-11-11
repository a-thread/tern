import { useEffect, useMemo, useState } from 'react';

import type { SearchResult } from '@/domain/food/sources/searchResult';
import {
  loadSizes,
  sizesKnown,
  sizesSettled,
  withSizes,
} from '../sources/foodSizes';

/**
 * How long the details screen waits for a food's sizes before showing it by weight. Short:
 * on a poor connection every food without sizes costs this long before it can be added.
 */
export class SizeWait {
  static readonly MAX_MS = 1200;
}

/**
 * A food with its household sizes, fetched if search left them out (or already fetched while
 * it was in the list). `loading` is true while they are on their way, up to `SizeWait.MAX_MS`,
 * so the screen can wait rather than show a weight and then jump to "1 packet".
 */
export function useFoodSizes(result: SearchResult): {
  food: SearchResult;
  loading: boolean;
} {
  const [, setDone] = useState(0);
  const [waited, setWaited] = useState(false);
  const known = sizesKnown(result);
  useEffect(() => {
    if (known) return undefined;
    let live = true;
    // Answered (or failed): stop waiting either way; a failure leaves the food by weight.
    loadSizes(result).then(() => {
      if (!live) return;
      setDone((n) => n + 1);
      setWaited(true);
    });
    const timer = setTimeout(() => live && setWaited(true), SizeWait.MAX_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [result.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const food = useMemo(() => withSizes(result), [result, known]); // eslint-disable-line react-hooks/exhaustive-deps
  // A food you've logged before opens on what you used last time, so it never waits: sizes
  // that arrive are only added to its choices.
  return { food, loading: !known && !waited && !result.last };
}

/** How many foods near the top of a search list get their sizes fetched, and how answers are gathered. */
export class SizePrefetch {
  static readonly TOP = 8;

  /** Answers arriving this close together fill the list in one go, without waiting on a slow one. */
  static readonly GATHER_MS = 150;
}

/**
 * The foods with their sizes filled in as they arrive, fetching them ahead of time for the
 * first few that came without, so opening one goes straight to "1 packet" with no wait.
 */
export function useListSizes<T extends SearchResult>(foods: T[]): T[] {
  const [version, setVersion] = useState(0);
  const isWanted = (f: T, i: number) =>
    i < SizePrefetch.TOP && !sizesSettled(f);
  const wanted = foods
    .filter(isWanted)
    .map((f) => f.id)
    .join('|');
  useEffect(() => {
    if (!wanted) return undefined;
    let live = true;
    // Answers close together make one re-render, and a slow one doesn't hold back the rest.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const gather = () => {
      if (!live || timer) return;
      timer = setTimeout(() => {
        timer = null;
        if (live) setVersion((n) => n + 1);
      }, SizePrefetch.GATHER_MS);
    };
    foods.filter(isWanted).forEach((f) => loadSizes(f).then(gather));
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [wanted]); // eslint-disable-line react-hooks/exhaustive-deps
  return useMemo(
    () => foods.map((f) => withSizes(f) as T),
    [foods, version], // eslint-disable-line react-hooks/exhaustive-deps
  );
}
