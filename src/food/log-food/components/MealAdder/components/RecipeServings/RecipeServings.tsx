import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Stepper } from '@shared/components/ui';
import {
  formatCount,
  Servings,
  stepServings,
} from '@/domain/food/models/servings';
import {
  SavedMealLimits,
  typedEaten,
} from '@/domain/saved-meals/models/savedMeals';

/** "How many servings?" for a recipe: quarter steps, or tap the number and type it. */
export function RecipeServings({
  value,
  makes,
  onChange,
}: {
  value: number;
  /** How many servings the whole recipe makes. */
  makes: number;
  onChange: (servings: number) => void;
}) {
  const [typed, setTyped] = useState<string | null>(null);
  const step = (delta: number) => {
    setTyped(null);
    onChange(
      Math.min(stepServings(value, delta), SavedMealLimits.MAX_SERVINGS),
    );
  };
  return (
    <View style={s.card}>
      <View style={s.text}>
        <Text style={s.title}>How many servings?</Text>
        <Text style={s.sub}>This makes {makes}</Text>
      </View>
      <Stepper
        value={typed ?? formatCount(value)}
        onDecrement={() => step(-Servings.STEP)}
        onIncrement={() => step(Servings.STEP)}
        decrementLabel='Fewer servings'
        incrementLabel='More servings'
        onChangeValue={(v) => {
          const text = v.replace(/[^0-9.,]/g, '');
          setTyped(text);
          const n = typedEaten(text);
          if (n !== null) onChange(n);
        }}
        onEndEditing={() => setTyped(null)}
        valueLabel='Servings eaten'
        valueMinWidth={44}
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
