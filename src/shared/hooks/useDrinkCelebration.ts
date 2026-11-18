import { useCallback } from 'react';
import type { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useReduceMotion } from './useReduceMotion';
import { useWaterSplash } from '../components/WaterSplashLayer/WaterSplashLayer';

/** A haptic and a splash; reduce motion drops the splash. */
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
