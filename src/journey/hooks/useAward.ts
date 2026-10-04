import { useEffect } from 'react';

import { useDayKey } from '@shared/hooks/useDayKey';
import { useWaypoints } from '@journey/WaypointsContext';
import { pointsFor, type WaypointSource } from '@journey/models/waypoint';

/**
 * Keeps today's award for `source` in step with `earned`: given when it becomes true,
 * quietly taken back when it stops being true. The ledger ignores repeats (one per source
 * per day), so this can run freely. `active` is the caller's own gate (tracking switched on,
 * data loaded, steps readable); nothing happens while it is false, so what was earned stays put.
 * It also waits for today's ledger, so a stale one never decides. `points` is the rule's
 * own amount unless the source's varies (a streak milestone).
 */
export function useAward(
  source: WaypointSource,
  earned: boolean,
  active: boolean,
  points: number = pointsFor(source),
) {
  const { day: awardDay, addWaypoints, revokeWaypoints } = useWaypoints();
  const today = useDayKey();

  useEffect(() => {
    if (!active || awardDay !== today) return;
    if (earned) addWaypoints(points, source);
    else revokeWaypoints(points, source);
  }, [source, earned, active, points, awardDay, today, addWaypoints, revokeWaypoints]);
}
