import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, font, space } from '@shared/theme';

/** A centred line of help text for an empty list. */
export function ListNote({ children }: { children: React.ReactNode }) {
  return <Text style={s.note}>{children}</Text>;
}

const s = StyleSheet.create({
  note: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 19,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
  },
});
