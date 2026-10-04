import { useEffect } from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@shared/navigation/types';
import { useWaypoints } from '@journey/WaypointsContext';
import { usePendingMilestone } from '@journey/hooks/usePendingMilestone';

/**
 * Opens the reward screen for a milestone that was just passed. It is marked once the feathers
 * have landed, so the total on the card is the one that crossed it. Like the bursts, a
 * milestone earned elsewhere (logging a meal, say) waits until Today is back on screen.
 */
export function useMilestoneReward(animating: boolean) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const { celebrations } = useWaypoints();
  const { pending: pendingMilestone, markCelebrated } = usePendingMilestone();

  useEffect(() => {
    if (!isFocused || animating || celebrations.length || !pendingMilestone) return;
    markCelebrated(pendingMilestone);
    navigation.navigate('Reward', {
      kind: 'milestone',
      title: pendingMilestone.name,
      subtitle:
        pendingMilestone.lap > 1
          ? `Milestone reached · Migration ${pendingMilestone.lap}`
          : 'Milestone reached',
      footer: 'Earned for showing up — never for weight or calories.',
    });
  }, [isFocused, animating, celebrations.length, pendingMilestone, markCelebrated, navigation]);
}
