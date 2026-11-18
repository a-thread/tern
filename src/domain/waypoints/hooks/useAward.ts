import { useEffect } from 'react';

import { useDayKey } from '@shared/hooks/useDayKey';
import { isTodayOrYesterday } from '@shared/utils/date';
import { useWaypoints } from '../WaypointsContext';
import { pointsFor, type WaypointSource } from '../models/waypoint';

type AwardOptions = {
  /** Default today; only today and yesterday are paid. */
  day?: string;
  /** Default the rule's amount (a streak milestone varies). */
  points?: number;
};

/** Keeps the source's award in sync with `earned` for today or yesterday.
 * Does nothing while inactive or until today's ledger is ready.
 */
export function useAward(
  source: WaypointSource,
  earned: boolean,
  active: boolean,
  { day, points = pointsFor(source) }: AwardOptions = {},
) {
  const { day: awardDay, addWaypoints, revokeWaypoints } = useWaypoints();
  const today = useDayKey();
  const on = day ?? today;

  useEffect(() => {
    if (!active || awardDay !== today || !isTodayOrYesterday(on, today)) return;
    if (earned) addWaypoints(points, source, on);
    else revokeWaypoints(points, source, on);
  }, [
    source,
    earned,
    active,
    points,
    on,
    awardDay,
    today,
    addWaypoints,
    revokeWaypoints,
  ]);
}
