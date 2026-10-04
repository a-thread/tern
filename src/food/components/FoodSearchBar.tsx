import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space } from '@shared/theme';

/** The search field, with a button that opens the barcode scanner. */
export function FoodSearchBar({
  value,
  onChange,
  onScan,
}: {
  value: string;
  onChange: (query: string) => void;
  onScan: () => void;
}) {
  return (
    <View style={s.bar}>
      <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke={colors.ink3} strokeWidth={2.5}>
        <Path d='M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4' />
      </Svg>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder='Search foods'
        placeholderTextColor={colors.ink3}
        style={s.input}
        autoFocus
      />
      <Pressable style={s.scan} onPress={onScan} accessibilityLabel='Scan a barcode'>
        <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='#fff' strokeWidth={2}>
          <Path d='M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M6 12h12' />
        </Svg>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.track,
    borderRadius: radius.md - 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: space.lg,
  },
  input: { flex: 1, fontFamily: font.body, fontSize: 14, color: colors.ink, padding: 0 },
  scan: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
