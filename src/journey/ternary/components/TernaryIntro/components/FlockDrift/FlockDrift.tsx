import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { gradients, radius, space } from '@shared/theme';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { FlockLooks } from '@/journey/models/flockLooks';

/** Three friends' birds, where each sits in the band (fractions of its size) and its pace. */
const BIRDS = [
  { look: 1, x: 0.3, y: 0.42, ms: 2600 },
  { look: 4, x: 0.52, y: 0.24, ms: 3100 },
  { look: 2, x: 0.68, y: 0.56, ms: 2900 },
];

class DriftSizes {
  static readonly HEIGHT = 96;
  static readonly BIRD = 34;
  /** How far each bird rises and falls, in points. */
  static readonly BOB = 5;
}

/** A small flock drifting on Journey's night sky, each bird a little out of step. */
export function FlockDrift() {
  return (
    <LinearGradient
      colors={[...gradients.journey]}
      style={s.sky}
      importantForAccessibility='no-hide-descendants'
      accessibilityElementsHidden
    >
      {BIRDS.map((b) => (
        <DriftingBird key={b.look} {...b} />
      ))}
    </LinearGradient>
  );
}

function DriftingBird({
  look,
  x,
  y,
  ms,
}: {
  look: number;
  x: number;
  y: number;
  ms: number;
}) {
  const still = useReduceMotion();
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (still) {
      t.setValue(0.5);
      return;
    }
    const half = (to: number) =>
      Animated.timing(t, {
        toValue: to,
        duration: ms / 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([half(1), half(0)]));
    loop.start();
    return () => loop.stop();
  }, [still, ms, t]);

  return (
    <Animated.Image
      source={FlockLooks.source(look)}
      style={[
        s.bird,
        {
          left: `${x * 100}%`,
          top: y * DriftSizes.HEIGHT - DriftSizes.BIRD / 2,
          transform: [
            {
              translateY: t.interpolate({
                inputRange: [0, 1],
                outputRange: [-DriftSizes.BOB, DriftSizes.BOB],
              }),
            },
            {
              translateX: t.interpolate({
                inputRange: [0, 1],
                outputRange: [-2, 2],
              }),
            },
          ],
        },
      ]}
      accessibilityIgnoresInvertColors
    />
  );
}

const s = StyleSheet.create({
  sky: {
    height: DriftSizes.HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: space.md,
  },
  bird: {
    position: 'absolute',
    width: DriftSizes.BIRD,
    height: DriftSizes.BIRD,
  },
});
