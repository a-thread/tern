import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, space, typography } from '@shared/theme';

/** A labelled text field on the ternary's pages: a name, or an invite code. */
export function TernaryField({
  label,
  value,
  onChangeText,
  code,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  /** An invite code: capitals, no autocorrect. */
  code?: boolean;
  maxLength?: number;
}) {
  return (
    <View style={s.field}>
      <Text style={typography.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={code ? 'characters' : 'words'}
        autoCorrect={!code}
        maxLength={maxLength}
        accessibilityLabel={label}
        style={[s.input, code && s.code]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  field: { gap: space.xs, marginBottom: space.md },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.ink,
  },
  code: { fontFamily: font.bold, letterSpacing: 3 },
});
