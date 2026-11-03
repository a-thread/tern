import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, space, typography } from '@shared/theme';
import { DayNoteText } from '@/domain/day-notes/models/dayNote';

/** The day's note: free text, with how much room is left once the end is near. */
export function DayNoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  const left = DayNoteText.MAX_LENGTH - value.length;
  return (
    <>
      <View style={s.card}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder='Energy, aches, sleep, anything that shaped the day…'
          placeholderTextColor={colors.ink3}
          maxLength={DayNoteText.MAX_LENGTH}
          multiline
          autoFocus
          textAlignVertical='top'
          accessibilityLabel='Note about your day'
          style={s.input}
        />
      </View>
      {/* Only once the end is in sight, so an empty note isn't counting at you. */}
      {left <= 50 ? (
        <Text style={s.count}>{`${left} characters left`}</Text>
      ) : null}
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
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink,
    minHeight: 140,
    paddingVertical: 10,
  },
  count: {
    ...typography.small,
    textAlign: 'right',
    marginTop: space.xs,
    marginRight: space.xs,
  },
});
