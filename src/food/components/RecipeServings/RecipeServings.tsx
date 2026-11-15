import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { ServingsStepper } from '../ServingsStepper/ServingsStepper';

/** "How many servings?" for a recipe: quarter steps, or tap the number and type it. */
export function RecipeServings({
  value,
  makes,
  onChange,
  title = 'How many servings?',
  sub = `This makes ${makes}`,
}: {
  value: number;
  /** How many servings the whole recipe makes. */
  makes: number;
  onChange: (servings: number) => void;
  /** The question, where the default reads too much like another servings row nearby. */
  title?: string;
  sub?: string;
}) {
  return (
    <View style={s.card}>
      <View style={s.text}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.sub}>{sub}</Text>
      </View>
      {/* Never more than the whole recipe: 80 servings of a pot that makes 8 is a slip. */}
      <ServingsStepper
        value={value}
        onChange={onChange}
        max={makes}
        valueLabel='Servings eaten'
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
  },
  text: { flex: 1 },
  title: typography.rowTitle,
  sub: { ...typography.caption, marginTop: 1 },
});
