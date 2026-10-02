import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads a context's data when `load` changes (it should be a `useCallback`, so its deps
 * say when to read again) and hands the result to `onLoaded`.
 *
 * - `ready` is false until the first load has settled, success or not.
 * - `reload` reads again and resolves to what was read, or null if reading failed
 *   (the failure is logged with `failureNote`, never thrown).
 * - Nothing is applied after unmount.
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
