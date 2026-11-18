import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, typography } from '@shared/theme';

/**
 * One line of a bulleted list, with the dot in its own column so a line that wraps lines up
 * under the words, not under the dot. A `sub` line sits indented under the one above it,
 * with a dash.
 */
export function Bullet({
  children,
  first,
  sub,
}: {
  /** Text, which may hold a link (a nested pressable `Text`). */
  children: React.ReactNode;
  /** The list's first line, with no space above it. */
  first?: boolean;
  /** A point under the line above, indented. */
  sub?: boolean;
}) {
  return (
    <View style={[s.row, !first && s.gap, sub && s.sub]}>
      <Text style={s.dot} importantForAccessibility='no'>
        {sub ? '–' : '•'}
      </Text>
      <Text style={s.text}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  gap: { marginTop: space.xs },
  sub: { marginLeft: space.lg },
  dot: { ...typography.meta, lineHeight: 19 },
  text: { ...typography.meta, lineHeight: 19, flex: 1 },
});
