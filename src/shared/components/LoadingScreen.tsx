import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { colors } from '@shared/theme';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import LoadingBird from './LoadingBird';

/**
 * A progress value that runs 0 → 1 over `ms` and starts again, beginning
 * `start` of the way through so things sharing a screen aren't in step.
 */
function useLap(start: number, ms: number) {
  const t = useRef(new Animated.Value(start)).current;
  useEffect(() => {
    const lap = (duration: number) =>
      Animated.timing(t, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      });
    const reset = Animated.timing(t, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    });
    const run = Animated.sequence([
      lap(ms * (1 - start)),
      reset,
      Animated.loop(Animated.sequence([lap(ms), reset])),
    ]);
    run.start();
    return () => run.stop();
  }, [t, start, ms]);
  return t;
}

/** Another bird crossing the sky behind the main one. Smaller and paler reads as farther away. */
type Flyer = {
  /** How far across it is at the start, so some are already in view. */
  start: number;
  /** Time to cross, in ms. */
  ms: number;
  size: number;
  /** Height in the sky, as a fraction of the screen. */
  top: number;
  color: string;
  /** Wingbeat speed; farther birds beat slower. */
  speed: number;
  /** How much it rises and falls on the way, in points. */
  drift: number;
};

const FLOCK: Flyer[] = [
  {
    start: 0.12,
    ms: 9500,
    size: 34,
    top: 0.2,
    color: colors.waterLight,
    speed: 1.1,
    drift: 8,
  },
  {
    start: 0.58,
    ms: 12000,
    size: 24,
    top: 0.3,
    color: colors.dove,
    speed: 0.95,
    drift: 12,
  },
  {
    start: 0.82,
    ms: 8500,
    size: 40,
    top: 0.7,
    color: colors.waterMid,
    speed: 1.2,
    drift: 9,
  },
  {
    start: 0.36,
    ms: 13000,
    size: 22,
    top: 0.8,
    color: colors.dove,
    speed: 1.0,
    drift: 6,
  },
];

function Crossing({
  bird,
  width,
  height,
}: {
  bird: Flyer;
  width: number;
  height: number;
}) {
  const t = useLap(bird.start, bird.ms);
  // Up and down on the way across, a little nearer in the middle than at either edge.
  const wobble = [0, 0.25, -0.1, 0.45, 0.15, -0.2, 0.3, 0, 0.2, -0.1, 0].map(
    (f) => f * bird.drift,
  );
  const translateX = t.interpolate({
    inputRange: [0, 1],
    outputRange: [-bird.size * 1.5, width + bird.size * 0.5],
  });
  const translateY = t.interpolate({
    inputRange: wobble.map((_, i) => i / (wobble.length - 1)),
    outputRange: wobble,
  });
  const scale = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1, 0.9],
  });
  return (
    <Animated.View
      pointerEvents='none'
      style={[
        s.flyer,
        {
          top: height * bird.top,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <LoadingBird
        decorative
        size={bird.size}
        color={bird.color}
        speed={bird.speed}
      />
    </Animated.View>
  );
}

/** A faint line of wind sliding the other way, so the main bird seems to be moving forward. */
type Streak = { start: number; ms: number; top: number; length: number };

const STREAKS: Streak[] = [
  { start: 0.1, ms: 1900, top: 0.43, length: 70 },
  { start: 0.55, ms: 2500, top: 0.52, length: 110 },
  { start: 0.8, ms: 1600, top: 0.6, length: 50 },
];

function WindStreak({
  streak,
  width,
  height,
}: {
  streak: Streak;
  width: number;
  height: number;
}) {
  const t = useLap(streak.start, streak.ms);
  const translateX = t.interpolate({
    inputRange: [0, 1],
    outputRange: [width, -streak.length],
  });
  const opacity = t.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 0.35, 0.35, 0],
  });
  return (
    <Animated.View
      pointerEvents='none'
      style={[
        s.streak,
        {
          top: height * streak.top,
          width: streak.length,
          opacity,
          transform: [{ translateX }],
        },
      ]}
    />
  );
}

/**
 * The full-screen loading state: one bird beating its wings at the middle with
 * wind sliding past, and a few more crossing the sky behind it at different
 * sizes and speeds. With "reduce motion" on it is the one bird, still.
 */
export default function LoadingScreen({
  background = colors.paper,
}: {
  background?: string;
}) {
  const { width, height } = useWindowDimensions();
  const still = useReduceMotion();
  return (
    <View style={[s.screen, { backgroundColor: background }]}>
      {still
        ? null
        : STREAKS.map((streak, i) => (
            <WindStreak
              key={`wind-${i}`}
              streak={streak}
              width={width}
              height={height}
            />
          ))}
      {still
        ? null
        : FLOCK.map((bird, i) => (
            <Crossing
              key={`bird-${i}`}
              bird={bird}
              width={width}
              height={height}
            />
          ))}
      <LoadingBird size={72} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  flyer: { position: 'absolute', left: 0 },
  streak: {
    position: 'absolute',
    left: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.dove,
  },
});
