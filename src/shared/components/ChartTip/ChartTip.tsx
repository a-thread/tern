import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, space, typography } from '../../theme';

/** `at` is 0–1 across the chart; the label hangs toward the middle so it never runs off. */
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
