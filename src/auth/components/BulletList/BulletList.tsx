import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, space, typography } from '@shared/theme';

export type Bullet = { text: string; lead?: string };

/** A short list with hanging indents, so a wrapped line lines up with its text, not the dot. */
export function BulletList({ items }: { items: Bullet[] }) {
  return (
    <View style={s.list}>
      {items.map(({ text, lead }) => (
        <View key={text} style={s.row}>
          <Text style={s.line} importantForAccessibility='no'>
            •
          </Text>
          <Text style={[s.line, s.text]}>
            {lead ? <Text style={s.lead}>{`${lead} `}</Text> : null}
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  list: { gap: space.sm, marginBottom: space.lg },
  row: { flexDirection: 'row', gap: space.sm },
  line: { ...typography.meta, lineHeight: 18 },
  text: { flex: 1 },
  lead: { fontFamily: font.bold, color: colors.ink },
});
