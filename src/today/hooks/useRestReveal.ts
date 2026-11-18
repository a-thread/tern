import { useCallback, useState } from 'react';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import { easeLayout } from '../utils/easeLayout';

/** Stays calm through the take-off so the page changes once. A reveal is tied to its day and rest. */
export function useRestReveal(
  isRest: boolean,
  leaving: boolean,
): { calm: boolean; reveal: () => void } {
  const { day } = useViewedDay();
  const revealKey = `${day}|${isRest}`;
  const [revealedFor, setRevealedFor] = useState<string | null>(null);

  const reveal = useCallback(() => {
    easeLayout();
    setRevealedFor(revealKey);
  }, [revealKey]);

  const calm = (isRest || leaving) && revealedFor !== revealKey;
  return { calm, reveal };
}
