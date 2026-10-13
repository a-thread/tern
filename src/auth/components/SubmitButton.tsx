import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';

/** Coral primary action; disabled until the form is valid, and shows `busyLabel` while working. */
export function SubmitButton({
  label,
  busyLabel,
  busy,
  disabled,
  onPress,
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const off = disabled || busy;
  return (
    <Pressable
      style={[s.button, off && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={off}
    >
      {busy ? (
        <View style={s.busyRow}>
          <ActivityIndicator color='#fff' size='small' />
          <Text style={s.buttonText}>{busyLabel}</Text>
        </View>
      ) : (
        <Text style={s.buttonText}>{label}</Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg - 1,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: space.sm,
  },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { fontFamily: font.bold, fontSize: 14.5, color: '#fff' },
});
