import React from 'react';
import { Text, type TextProps } from 'react-native';

import { useAnimatedNumber, useCountUp } from '../hooks/useAnimatedNumber';

/* Small components keep animation updates local to the number. */

/** Counts from 0 to `target`, replaying when `replayKey` changes. */
export function CountUp({
  target,
  replayKey,
  duration,
  ...text
}: { target: number; replayKey?: number; duration?: number } & TextProps) {
  const value = useCountUp(target, replayKey, duration);
  return <Text {...text}>{value.toLocaleString()}</Text>;
}

/** A number that eases to `value` whenever it changes (and shows it as-is on first render). */
export function AnimatedNumber({
  value,
  duration,
  ...text
}: { value: number; duration?: number } & TextProps) {
  const shown = useAnimatedNumber(value, duration);
  return <Text {...text}>{shown.toLocaleString()}</Text>;
}
