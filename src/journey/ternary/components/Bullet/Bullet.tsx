import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import type { IconName } from '@shared/components/ui/Icon';

/**
 * One line of a bulleted list, with the dot in its own column so a line that wraps lines up
 * under the words, not under the dot. A `sub` line sits indented under the one above it,
 * with a dash.
 */
export function Bullet({
  children,
  first,
  sub,
  icon,
  iconColor = colors.ink2,
}: {
  /** Text, which may hold a link (a nested pressable `Text`). */
  children: React.ReactNode;
  /** The list's first line, with no space above it. */
  first?: boolean;
  /** A point under the line above, indented. */
  sub?: boolean;
  /** An icon in place of the dot, saying what kind of list it is (seen, never seen). */
  icon?: IconName;
  iconColor?: string;
}) {
  return (
    <View style={[s.row, !first && s.gap, sub && s.sub]}>
      {icon ? (
        <View style={s.icon}>
          <Icon name={icon} size={16} color={iconColor} />
        </View>
      ) : (
        <Text style={s.dot} importantForAccessibility='no'>
          {sub ? '–' : '•'}
        </Text>
      )}
      <Text style={s.text}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  gap: { marginTop: space.xs },
  sub: { marginLeft: space.lg },
  dot: { ...typography.meta, lineHeight: 19 },
  // Centred on the first line of text, whose line height is 19.
  icon: { height: 19, justifyContent: 'center' },
  text: { ...typography.meta, lineHeight: 19, flex: 1 },
});
