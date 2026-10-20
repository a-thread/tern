import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius, space, typography } from '@shared/theme';
import { MealCheckInNote } from '@/domain/meal-check-ins/models/mealCheckIn';

/** The optional note on a meal check-in: a few lines of free text, with how much room is left. */
export function NoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  const left = MealCheckInNote.MAX_LENGTH - value.length;
  return (
    <>
      <View style={s.card}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder='Where you were, who with, how it tasted…'
          placeholderTextColor={colors.ink3}
          maxLength={MealCheckInNote.MAX_LENGTH}
          multiline
          textAlignVertical='top'
          accessibilityLabel='Note about this meal'
          accessibilityHint='Optional'
          style={s.input}
        />
      </View>
      {/* Only once the end is in sight, so an empty note isn't counting at you. */}
      {left <= 40 ? (
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
    minHeight: 76,
    paddingVertical: 10,
  },
  count: {
    ...typography.small,
    textAlign: 'right',
    marginTop: space.xs,
    marginRight: space.xs,
  },
});
