import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Stepper } from '@shared/components/ui';
import {
  cleanServings,
  typedYield,
} from '@/domain/saved-meals/models/savedMeals';

/** "Makes 8 servings": how many servings a meal makes, steppable or typed. More than 1 makes it a recipe. */
export function MealServingsRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (servings: number) => void;
}) {
  const [typed, setTyped] = useState<string | null>(null);
  const change = (next: number) => {
    setTyped(null);
    onChange(cleanServings(next));
  };
  return (
    <View style={s.card}>
      <View style={s.text}>
        <Text style={s.title}>Makes</Text>
        <Text style={s.sub}>
          More than 1 makes it a recipe, logged by the serving
        </Text>
      </View>
      <Stepper
        value={typed ?? String(value)}
        onDecrement={() => change(value - 1)}
        onIncrement={() => change(value + 1)}
        decrementLabel='Make fewer servings'
        incrementLabel='Make more servings'
        onChangeValue={(v) => {
          const text = v.replace(/[^0-9]/g, '');
          setTyped(text);
          const n = typedYield(text);
          if (n !== null) onChange(n);
        }}
        onEndEditing={() => setTyped(null)}
        valueLabel='Servings this meal makes'
        valueMinWidth={36}
      />
      <Text style={s.title}>{value === 1 ? 'serving' : 'servings'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
  },
  text: { flex: 1 },
  title: typography.rowTitle,
  sub: { ...typography.caption, marginTop: 1 },
});
