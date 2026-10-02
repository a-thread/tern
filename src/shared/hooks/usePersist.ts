import { useCallback } from 'react';

import { useToast } from '@shared/state/ToastContext';

/** What to say when a background write fails: a console note, and a message for the person. */
export type PersistFailure = { log: string; toast: string };

/**
 * For optimistic edits: change the screen first, then pass the repository write here.
 * If it fails, the person is told and the data is reloaded, so the screen never keeps
 * showing something that wasn't saved.
 */
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
