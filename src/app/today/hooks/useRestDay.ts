import { useCallback, useEffect, useState } from 'react';

import { DayState } from '../../shared/models/dayState';
import { useViewedDay } from '../../shared/state/ViewedDayContext';
import { useActivity } from '../../domain/activity/ActivityContext';
import type { DayRecord } from '../../domain/activity/models/dayRecord';
import { RestScenes } from '../models/restScene';

/**
 * Whether the viewed day is a rest day, and how the rest scene should come and go.
 *
 * `showScene` is true on a rest day, and for the moment after a rest day is undone while the
 * tern flies off (`leaving`). `entrance` is `arrive` only when today has just become a rest day
 * on this screen (the tern flies in); opening Today on an existing rest day, or looking back at
 * one, shows the scene already settled.
 *
 * `holdCelebrations` is true while the tern is still flying in: the waypoints for resting wait for
 * its landing (`markTouchedDown`, called by the scene), and are never held for long.
 */
export function useRestDay(): {
  isRest: boolean;
  record: DayRecord | undefined;
  showScene: boolean;
  entrance: boolean;
  leaving: boolean;
  finishLeaving: () => void;
  holdCelebrations: boolean;
  markTouchedDown: () => void;
} {
  const { day, isToday } = useViewedDay();
  const { week, ready } = useActivity();
  const record = week.find((d) => d.day === day);
  const isRest = record?.state === DayState.Rest;

  // Noticed while rendering (React's way of adjusting state to a change in what it reads), so
  // the scene never drops out for a frame between the two states.
  const [before, setBefore] = useState({ day, isRest, ready });
  const [entrance, setEntrance] = useState(false);
  const [leavingFlag, setLeavingFlag] = useState(false);
  const [touchedDown, setTouchedDown] = useState(false);
  if (
    before.day !== day ||
    before.isRest !== isRest ||
    before.ready !== ready
  ) {
    // Not while the rest days are still loading: an existing rest day appearing isn't a new one.
    const sameToday = isToday && before.day === day && before.ready && ready;
    setBefore({ day, isRest, ready });
    setEntrance(sameToday && isRest && !before.isRest);
    setLeavingFlag(sameToday && !isRest && before.isRest);
    setTouchedDown(false);
  }
  const leaving = leavingFlag && !isRest;
  const finishLeaving = useCallback(() => setLeavingFlag(false), []);
  const markTouchedDown = useCallback(() => setTouchedDown(true), []);

  const holdCelebrations = entrance && isRest && !touchedDown;
  // Whatever happens to the scene, the waypoints are never kept waiting for long.
  useEffect(() => {
    if (!holdCelebrations) return;
    const timer = setTimeout(() => setTouchedDown(true), RestScenes.FLIGHT_MS + 1000);
    return () => clearTimeout(timer);
  }, [holdCelebrations]);

  return {
    isRest,
    record,
    showScene: isRest || leaving,
    entrance,
    leaving,
    finishLeaving,
    holdCelebrations,
    markTouchedDown,
  };
}
