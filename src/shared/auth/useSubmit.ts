import { useCallback, useState } from 'react';

/**
 * Runs an async form submission, tracking `busy` and the error message to
 * show. Resolves true on success. Ignores taps while one is in flight.
 */
export function useSubmit(fallbackError: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      if (busy) return false;
      setBusy(true);
      setError('');
      try {
        await action();
        return true;
      } catch (e) {
        setError(e instanceof Error && e.message ? e.message : fallbackError);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [busy, fallbackError],
  );

  return { busy, error, run };
}
