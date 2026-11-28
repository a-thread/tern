import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, typography } from '@shared/theme';

/**
 * One thing you can do in a ternary: a small picture, a short title, and a line or two (or a
 * few `Bullet sub` points) saying it plainly. The picture is decoration; the words carry it.
 */
export function Feature({
  picture,
  title,
  children,
  first,
}: {
  picture: React.ReactNode;
  title: string;
  /** A sentence, or a few `Bullet sub` points. */
  children: React.ReactNode;
  /** The card's first feature, with no space above it. */
  first?: boolean;
}) {
  return (
    <View style={[s.row, !first && s.gap]}>
      <View style={s.picture} importantForAccessibility='no-hide-descendants'>
        {picture}
      </View>
      <View style={s.words}>
        <Text style={typography.rowTitle}>{title}</Text>
        {typeof children === 'string' ? (
          <Text style={s.text}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  gap: { marginTop: space.lg },
  // Wide enough for the three-bird flock, so every title lines up.
  picture: { width: 66, alignItems: 'center', paddingTop: 2 },
  words: { flex: 1, gap: 2 },
  text: { ...typography.meta, lineHeight: 19 },
});
