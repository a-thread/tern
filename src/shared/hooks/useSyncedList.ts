import { useCallback, useState } from 'react';

import { useLoader } from './useLoader';
import { usePersist, type PersistFailure } from './usePersist';

/** `useLoader` + `usePersist` for an optimistic list. */
export function useSyncedList<T>(
  load: () => Promise<T[]>,
  failureNote: string,
) {
  const [entries, setEntries] = useState<T[]>([]);
  const { ready, reload } = useLoader(load, setEntries, failureNote);
  const persist = usePersist(reload);
  const change = useCallback(
    (
      update: (prev: T[]) => T[],
      write: Promise<unknown>,
      failure: PersistFailure,
    ) => {
      setEntries(update);
      persist(write, failure);
    },
    [persist],
  );
  return { entries, ready, reload, change };
}
