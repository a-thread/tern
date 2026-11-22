import { useState } from 'react';

import { useReplayOnFocus } from '@shared/hooks/useReplayOnFocus';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useActivity } from '../../domain/activity/ActivityContext';

/** Both only count up, so their sum never repeats. */
export function useFlightKey(): { replayKey: number; flightKey: number } {
  const { todaySteps } = useActivity();
  const { day } = useViewedDay();
  const replayKey = useReplayOnFocus(todaySteps);

  // Counted while rendering, so the new day's first frame already has its new key.
  const [picks, setPicks] = useState({ day, count: 0 });
  if (picks.day !== day) setPicks({ day, count: picks.count + 1 });

  return { replayKey, flightKey: replayKey + picks.count };
}
