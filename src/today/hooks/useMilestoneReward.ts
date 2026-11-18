import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { useWaypoints } from '../../domain/waypoints/WaypointsContext';
import { usePendingMilestone } from './usePendingMilestone';
import { useRootNavigation } from '../../navigation/useAppNavigation';

/** Marked once the feathers land, so the card shows the total that crossed it. */
export function useMilestoneReward(waiting: boolean) {
  const navigation = useRootNavigation();
  const isFocused = useIsFocused();
  const { celebrations } = useWaypoints();
  const { pending: pendingMilestone, markCelebrated } = usePendingMilestone();

  useEffect(() => {
    if (!isFocused || waiting || celebrations.length || !pendingMilestone)
      return;
    markCelebrated(pendingMilestone);
    navigation.navigate('Milestone', { waypoints: pendingMilestone.waypoints });
  }, [
    isFocused,
    waiting,
    celebrations.length,
    pendingMilestone,
    markCelebrated,
    navigation,
  ]);
}
