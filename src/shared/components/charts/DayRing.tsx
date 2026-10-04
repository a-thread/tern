import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, font } from '@shared/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ------------------------------------------------------------------ */
/* Day rings (week strip)                                               */
/* ------------------------------------------------------------------ */

function DayRingBase({
  progress,
  label,
  today,
  rest,
  size = 23,
  replayKey = 0,
  delay = 0,
}: {
  progress: number;
  label: string;
  today?: boolean;
  rest?: boolean;
  size?: number;
  /** Bump to refill the ring from empty. */
  replayKey?: number;
  /** Stagger, in ms, before the ring starts filling. */
  delay?: number;
}) {
  const r = 12;
  const circ = 2 * Math.PI * r;
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fill.setValue(0);
    Animated.timing(fill, {
      toValue: 1,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, replayKey, delay, fill]);

  const ringOffset = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, circ * (1 - Math.min(progress, 1))],
  });
  const stroke = rest ? colors.driftwood : today ? colors.sun : colors.glacier;
  const track = rest ? '#E4DECE' : colors.border;
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Svg
        width={today ? size + 3 : size}
        height={today ? size + 3 : size}
        viewBox='0 0 30 30'
      >
        <Circle
          cx={15}
          cy={15}
          r={r}
          fill='none'
          stroke={track}
          strokeWidth={4}
        />
        <AnimatedCircle
          cx={15}
          cy={15}
          r={r}
          fill='none'
          stroke={stroke}
          strokeWidth={4}
          strokeLinecap='round'
          strokeDasharray={circ}
          strokeDashoffset={ringOffset as unknown as number}
          transform='rotate(-90 15 15)'
        />
      </Svg>
      <Text
        style={[
          cs.dayLabel,
          today && { fontFamily: font.bold, color: colors.ink },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// Memoized: the week strip re-renders with its screen, but a ring only needs to when its own props change.
export const DayRing = React.memo(DayRingBase);

const cs = StyleSheet.create({
  dayLabel: { fontFamily: font.body, fontSize: 9.5, color: colors.ink2 },
});
