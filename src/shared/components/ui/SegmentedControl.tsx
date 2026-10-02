import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font } from '@shared/theme';

/** A row of equal pills where exactly one is chosen, e.g. a date range or a meal. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label = (option) => option,
  style,
}: {
  options: readonly T[];
  value: T;
  onChange: (option: T) => void;
  /** The text shown for an option; defaults to the option itself. */
  label?: (option: T) => string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.seg, style]}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[s.item, selected && s.itemOn]}
            accessibilityRole='button'
            accessibilityState={{ selected }}
          >
            <Text style={[s.text, selected && s.textOn]}>{label(option)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  seg: {
    flexDirection: 'row',
    backgroundColor: colors.track,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  itemOn: { backgroundColor: colors.card },
  text: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  textOn: { fontFamily: font.semibold, color: colors.ink },
});
