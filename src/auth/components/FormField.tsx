import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';

/**
 * Text field that only shows its error once it has been touched (blurred),
 * so people aren't scolded while they're still typing.
 */
export function FormField({
  label,
  value,
  onChangeText,
  kind,
  autoComplete,
  invalid,
  errorMessage,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  kind: 'email' | 'password' | 'name';
  autoComplete: 'email' | 'current-password' | 'new-password' | 'given-name';
  invalid?: boolean;
  errorMessage?: string;
  onSubmitEditing?: () => void;
}) {
  const [touched, setTouched] = useState(false);
  const showInvalid = touched && invalid;
  return (
    <View style={{ marginBottom: space.sm }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={() => setTouched(true)}
        onSubmitEditing={onSubmitEditing}
        secureTextEntry={kind === 'password'}
        keyboardType={kind === 'email' ? 'email-address' : 'default'}
        autoCapitalize={kind === 'name' ? 'words' : 'none'}
        autoCorrect={kind === 'name'}
        autoComplete={autoComplete}
        accessibilityLabel={label}
        style={[s.input, showInvalid && s.inputInvalid]}
      />
      {showInvalid && errorMessage ? (
        <Text style={s.fieldError}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    fontFamily: font.medium,
    fontSize: 12.5,
    color: colors.ink2,
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.lg - 1,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: space.md,
    paddingVertical: 13,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink,
  },
  inputInvalid: { borderColor: colors.coral },
  fieldError: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.coral,
    marginTop: 4,
  },
});
