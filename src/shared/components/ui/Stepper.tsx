import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font } from '@shared/theme';

/**
 * A − / + control around a value, for servings, scales, times and counts. `compact`
 * is the tighter version for rows that already hold a name and a remove button.
 */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
  valueMinWidth = 40,
  compact = false,
  style,
}: {
  value: string | number;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel?: string;
  incrementLabel?: string;
  valueMinWidth?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.stepper, style]}>
      <Pressable onPress={onDecrement} hitSlop={8} accessibilityLabel={decrementLabel}>
        <Text style={[s.btn, compact && s.btnCompact]}>−</Text>
      </Pressable>
      <Text style={[s.value, compact && s.valueCompact, { minWidth: valueMinWidth }]}>
        {value}
      </Text>
      <Pressable onPress={onIncrement} hitSlop={8} accessibilityLabel={incrementLabel}>
        <Text style={[s.btn, compact && s.btnCompact]}>+</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.track,
    borderRadius: 10,
    overflow: 'hidden',
  },
  btn: {
    fontFamily: font.body,
    fontSize: 17,
    color: colors.coral,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnCompact: { fontSize: 16, paddingHorizontal: 9, paddingVertical: 4 },
  value: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
  },
  valueCompact: { fontSize: 12 },
});
