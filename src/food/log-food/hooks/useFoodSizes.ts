import { useEffect, useMemo, useState } from 'react';

import type { SearchResult } from '@/domain/food/sources/searchResult';
import {
  loadSizes,
  sizesKnown,
  withSizes,
} from '../sources/foodSizes';

/** How long the details screen waits for a food's sizes before showing it by weight. */
export class SizeWait {
  static readonly MAX_MS = 2500;
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
  return { food, loading: !known && !waited };
}

/** How many foods near the top of a search list get their sizes fetched. */
export class SizePrefetch {
  static readonly TOP = 8;
}

/**
 * The foods with their sizes filled in as they arrive, fetching them for the first few that
 * came without (so the list can say "1 packet · 130 cal" and the details screen opens on it).
 */
export function useListSizes<T extends SearchResult>(foods: T[]): T[] {
  const [version, setVersion] = useState(0);
  const wanted = foods
    .slice(0, SizePrefetch.TOP)
    .filter((f) => !sizesKnown(f))
    .map((f) => f.id)
    .join('|');
  useEffect(() => {
    if (!wanted) return undefined;
    let live = true;
    foods
      .slice(0, SizePrefetch.TOP)
      .filter((f) => !sizesKnown(f))
      .forEach((f) =>
        loadSizes(f).then(() => live && setVersion((n) => n + 1)),
      );
    return () => {
      live = false;
    };
  }, [wanted]); // eslint-disable-line react-hooks/exhaustive-deps
  return useMemo(
    () => foods.map((f) => withSizes(f) as T),
    [foods, version], // eslint-disable-line react-hooks/exhaustive-deps
  );
}
