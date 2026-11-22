import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reloads when `load` (a `useCallback`) changes. `ready` once the first load settles either
 * way; `reload` resolves to null on failure (logged, never thrown).
 */
export function useLoader<T>(
  load: () => Promise<T>,
  onLoaded: (value: T) => void,
  failureNote: string,
): { ready: boolean; reload: () => Promise<T | null> } {
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);
  const apply = useRef(onLoaded);
  apply.current = onLoaded;

  const reload = useCallback(async (): Promise<T | null> => {
    try {
      const value = await load();
      if (mounted.current) apply.current(value);
      return value;
    } catch (e) {
      console.warn(failureNote, e);
      return null;
    }
  }, [load, failureNote]);

  useEffect(() => {
    mounted.current = true;
    reload().finally(() => mounted.current && setReady(true));
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  return { ready, reload };
}
