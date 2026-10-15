import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, font, radius } from '@shared/theme';

/** A single-line text field on a white card, with an error line under it when `error` is set. */
export function TextField({
  error,
  ...input
}: Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  error?: string | null;
}) {
  return (
    <>
      <View style={s.card}>
        <TextInput
          placeholderTextColor={colors.ink3}
          returnKeyType='done'
          style={s.input}
          {...input}
        />
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 13,
    paddingVertical: 4,
  },
  input: {
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 11,
  },
  error: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: colors.danger,
    marginTop: 6,
    marginLeft: 4,
  },
});
