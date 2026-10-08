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
  frozen,
  selected,
  size = 23,
  replayKey = 0,
  delay = 0,
}: {
  progress: number;
  label: string;
  today?: boolean;
  rest?: boolean;
  /** A streak freeze covered this day. */
  frozen?: boolean;
  /** The day being looked at: drawn with a thin outline. */
  selected?: boolean;
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
  const stroke = rest ? colors.driftwood : frozen ? colors.glacierDeep : today ? colors.sun : colors.glacier;
  const track = rest ? '#E4DECE' : frozen ? '#D5E6EA' : colors.border;
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View
        style={[
          cs.outline,
          selected && { borderColor: colors.glacierDeep },
        ]}
      >
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
      </View>
      <Text
        style={[
          cs.dayLabel,
          (today || selected) && { fontFamily: font.bold, color: colors.ink },
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
  outline: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayLabel: { fontFamily: font.body, fontSize: 9.5, color: colors.ink2 },
});
