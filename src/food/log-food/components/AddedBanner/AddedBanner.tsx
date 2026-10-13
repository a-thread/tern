import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';

/** A one-line confirmation ("Added to Lunch: Oats") shown while Add food stays open. */
export default function AddedBanner({
  message,
  dark = false,
}: {
  message: string;
  /** For the scanner's dark background. */
  dark?: boolean;
}) {
  return (
    <View
      style={[s.banner, dark ? s.dark : s.light]}
      accessibilityLiveRegion='polite'
    >
      <Text style={[s.check, { color: dark ? colors.coral : colors.kelp }]}>✓</Text>
      <Text style={[s.text, dark && { color: '#F2F6F7' }]} numberOfLines={2}>
        {message}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 9,
  },
  light: { backgroundColor: colors.kelpTint, marginHorizontal: space.lg, marginBottom: space.sm },
  dark: { backgroundColor: 'rgba(255,255,255,0.09)', alignSelf: 'stretch', marginTop: space.md },
  check: { fontFamily: font.bold, fontSize: 13 },
  text: { flex: 1, fontFamily: font.medium, fontSize: 12.5, color: colors.ink },
});
