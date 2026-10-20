import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, typography } from '@shared/theme';
import {
  MEAL_SCORES,
  mealScoreWord,
  type MealCheckInMetric,
} from '@/domain/meal-check-ins/models/mealCheckIn';

/** One question of a meal check-in: five choices, each with its word, one picked at a time. */
export function ScoreChoice({
  metric,
  label,
  value,
  onChange,
  color,
  tint,
}: {
  metric: MealCheckInMetric;
  /** The question, for screen readers ("Fullness"). */
  label: string;
  value: number | null;
  onChange: (score: number) => void;
  color: string;
  tint: string;
}) {
  return (
    <View
      style={s.row}
      accessibilityRole='radiogroup'
      accessibilityLabel={label}
    >
      {MEAL_SCORES.map((n) => {
        const on = value === n;
        const word = mealScoreWord(metric, n);
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[s.choice, { backgroundColor: on ? color : tint }]}
            accessibilityRole='radio'
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${label}: ${word}`}
          >
            <Text style={[s.num, { color: on ? colors.card : color }]}>
              {n}
            </Text>
            <Text
              style={[s.word, on && { color: colors.card }]}
              numberOfLines={2}
            >
              {word}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  choice: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: space.sm + 2,
    paddingHorizontal: 2,
  },
  num: { fontFamily: font.displayMedium, fontSize: 20 },
  word: { ...typography.small, textAlign: 'center', marginTop: 2 },
});
