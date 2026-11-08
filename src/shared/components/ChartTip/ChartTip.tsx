import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, space, typography } from '../../theme';

/**
 * A small label over a chart naming the piece that was tapped ("Aug 2 · 8,410 steps").
 * `at` is where that piece sits across the chart, 0 (left edge) to 1 (right edge); the
 * label hangs from that point towards the middle so it never runs off the chart. It sits at
 * the top of its parent, or with `above`, just over it (over a row of squares, say).
 */
export function ChartTip({
  text,
  at,
  above = false,
}: {
  text: string;
  at: number;
  above?: boolean;
}) {
  const anchor: ViewStyle =
    at <= 0.5
      ? { left: `${at * 100}%` as const }
      : { right: `${(1 - at) * 100}%` as const };
  return (
    <View
      pointerEvents='none'
      style={[s.tip, above ? s.above : null, anchor]}
      accessibilityLiveRegion='polite'
    >
      <Text style={s.text} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  tip: {
    position: 'absolute',
    top: 0,
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    zIndex: 1,
  },
  above: { top: undefined, bottom: '100%', marginBottom: space.xs },
  text: { ...typography.small, color: colors.card },
});
