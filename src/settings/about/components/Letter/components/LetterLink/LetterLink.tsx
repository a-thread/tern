import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import type { IconName } from '@shared/components/ui/Icon';

/** One link under the letter: it leaves Tern for the browser or the mail app. */
export function LetterLink({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={s.link}
      onPress={onPress}
      hitSlop={4}
      accessibilityRole='link'
      accessibilityLabel={label}
    >
      <Icon name={icon} size={18} color={colors.ink2} />
      <Text style={s.label}>{label}</Text>
      <Icon name='open-in-new' size={14} color={colors.ink3} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  label: { ...typography.rowTitle, flex: 1 },
});
