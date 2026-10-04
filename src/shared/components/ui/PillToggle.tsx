import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font } from '@shared/theme';

/** A compact either/or switch with the chosen option filled in, e.g. lb / kg or Daily / Weekly. */
export function PillToggle<T extends string>({
  options,
  value,
  onChange,
  label = (option) => option,
}: {
  options: readonly T[];
  value: T;
  onChange: (option: T) => void;
  /** The text shown for an option; defaults to the option itself. */
  label?: (option: T) => string;
}) {
  return (
    <View style={s.track}>
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
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.track,
    borderRadius: 10,
    overflow: 'hidden',
  },
  item: { paddingHorizontal: 16, paddingVertical: 7 },
  itemOn: { backgroundColor: colors.ink },
  text: { fontFamily: font.semibold, fontSize: 13, color: colors.ink2 },
  textOn: { color: colors.paper },
});
