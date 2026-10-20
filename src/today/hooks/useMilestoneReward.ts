import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';

import { useWaypoints } from '../../domain/waypoints/WaypointsContext';
import { usePendingMilestone } from './usePendingMilestone';
import { useRootNavigation } from '../../navigation/useAppNavigation';

/**
 * Opens the reward screen for a milestone that was just passed. It is marked once the feathers
 * have landed, so the total on the card is the one that crossed it. Like the bursts, a
 * milestone earned elsewhere (logging a meal, say) waits until Today is back on screen, and
 * `waiting` holds it while a burst plays or a sheet is open over Today.
 */
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
