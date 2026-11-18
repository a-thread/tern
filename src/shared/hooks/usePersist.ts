import { useCallback } from 'react';

import { useToast } from '../state/ToastContext';

/** What to say when a background write fails: a console note, and a message for the person. */
export type PersistFailure = { log: string; toast: string };

/** For optimistic writes: on failure, tells the person and reloads. */
export function usePersist(reload: () => unknown) {
  const toast = useToast();
  return useCallback(
    (write: Promise<unknown>, failure: PersistFailure) => {
      write.catch((e) => {
        console.warn(failure.log, e);
        toast.show(failure.toast);
        reload();
      });
    },
    [toast, reload],
  );
}
