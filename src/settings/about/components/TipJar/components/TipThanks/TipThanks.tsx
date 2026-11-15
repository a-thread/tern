import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';

/** The thank-you after a tip. It stays in the card rather than fading like a toast. */
export function TipThanks({ text }: { text: string }) {
  return (
    <View style={s.thanks} accessibilityLiveRegion='polite'>
      <Icon name='heart-outline' size={16} color={colors.aurora} />
      <Text style={s.text}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  thanks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.auroraTint,
    borderRadius: radius.md,
  },
  text: { ...typography.meta, color: colors.aurora, flex: 1 },
});
