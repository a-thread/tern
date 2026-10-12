import { useCallback, useState } from 'react';

import { useLoader } from './useLoader';
import { usePersist, type PersistFailure } from './usePersist';

/**
 * A list a context loads from storage and edits optimistically. `change` updates the list on
 * screen straight away and hands the repository write to `usePersist`, which tells the person and
 * reloads if it fails.
 */
export function useSyncedList<T>(load: () => Promise<T[]>, failureNote: string) {
  const [entries, setEntries] = useState<T[]>([]);
  const { ready, reload } = useLoader(load, setEntries, failureNote);
  const persist = usePersist(reload);
  const change = useCallback(
    (update: (prev: T[]) => T[], write: Promise<unknown>, failure: PersistFailure) => {
      setEntries(update);
      persist(write, failure);
    },
    [persist],
  );
  return { entries, ready, reload, change };
}
