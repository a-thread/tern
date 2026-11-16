import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, typography } from '@shared/theme';

/**
 * One line of a bulleted list, with the dot in its own column so a line that wraps lines up
 * under the words, not under the dot.
 */
export function Bullet({
  children,
  first,
}: {
  children: React.ReactNode;
  /** The list's first line, with no space above it. */
  first?: boolean;
}) {
  return (
    <View style={[s.row, !first && s.gap]}>
      <Text style={s.dot} importantForAccessibility='no'>
        •
      </Text>
      <Text style={s.text}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  gap: { marginTop: space.xs },
  dot: { ...typography.meta, lineHeight: 19 },
  text: { ...typography.meta, lineHeight: 19, flex: 1 },
});
