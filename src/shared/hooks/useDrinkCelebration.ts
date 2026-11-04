import { useCallback } from 'react';
import type { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useReduceMotion } from './useReduceMotion';
import { useWaterSplash } from '../components/WaterSplashLayer/WaterSplashLayer';

/**
 * Feedback for a logged drink, so it registers as done: a haptic tap (a success buzz when the
 * drink reaches the goal) and a splash of droplets and bubbles around the button that logged it.
 * With reduce motion on there is no splash, only the buzz.
 */
export function useDrinkCelebration() {
  const reduceMotion = useReduceMotion();
  const layer = useWaterSplash();

  return useCallback(
    (reachedGoal: boolean, from: View | null) => {
      const buzz = reachedGoal
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      buzz.catch(() => {}); // no haptics engine (simulator, some Android phones)
      if (!reduceMotion) layer?.splash(from, reachedGoal);
    },
    [layer, reduceMotion],
  );
}
