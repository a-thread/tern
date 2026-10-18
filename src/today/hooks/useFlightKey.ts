import { useState } from 'react';

import { useReplayOnFocus } from '@shared/hooks/useReplayOnFocus';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useActivity } from '../../domain/activity/ActivityContext';

/**
 * The keys that replay Today's animations. `replayKey` changes when the screen comes back into
 * focus with new steps; `flightKey` also changes for each day picked, so the bird flies again
 * from the start. Both only ever count up, so their sum never repeats.
 */
export function useFlightKey(): { replayKey: number; flightKey: number } {
  const { todaySteps } = useActivity();
  const { day } = useViewedDay();
  const replayKey = useReplayOnFocus(todaySteps);

  // Counted while rendering, so the new day's first frame already has its new key.
  const [picks, setPicks] = useState({ day, count: 0 });
  if (picks.day !== day) setPicks({ day, count: picks.count + 1 });

  return { replayKey, flightKey: replayKey + picks.count };
}
