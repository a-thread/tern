import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, typography } from '@shared/theme';

/** `nested` (default) indents under a reminder's toggle. */
export function SettingsSubRow({
  label,
  nested = true,
  children,
}: {
  label: string;
  nested?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[s.row, nested ? s.rowNested : s.rowTop]}>
      <Text style={nested ? s.label : s.labelTop}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  rowNested: { paddingLeft: 26, paddingVertical: 8 },
  rowTop: { paddingVertical: 10 },
  label: { flex: 1, fontFamily: font.body, fontSize: 13, color: colors.ink2 },
  labelTop: { ...typography.rowTitle, flex: 1 },
});
