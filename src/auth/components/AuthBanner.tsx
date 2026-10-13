import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';

/** Error or info message above a form; renders nothing when there's no message. */
export function AuthBanner({
  variant,
  message,
}: {
  variant: 'error' | 'info';
  message: string | null;
}) {
  if (!message) return null;
  return (
    <View style={[s.banner, variant === 'error' ? s.bannerError : s.bannerInfo]}>
      <Text style={s.bannerText}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    borderRadius: radius.lg - 1,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    marginBottom: space.md,
  },
  bannerError: { backgroundColor: colors.coralTint },
  bannerInfo: { backgroundColor: colors.glacierTint },
  bannerText: {
    fontFamily: font.medium,
    fontSize: 12.5,
    color: colors.ink,
    lineHeight: 18,
  },
});
