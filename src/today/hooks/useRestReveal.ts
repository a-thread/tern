import { useCallback, useState } from 'react';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import { easeLayout } from '../utils/easeLayout';

/**
 * Whether Today shows the calm rest day lists, and `reveal` for "Log something anyway".
 *
 * Calm while resting, and through the take-off after undoing it (`leaving`): the usual lists wait
 * until the tern has gone, so the page changes once, not twice. A reveal is kept as the day and
 * rest it was tapped for, so changing either puts the calm back at once.
 */
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
