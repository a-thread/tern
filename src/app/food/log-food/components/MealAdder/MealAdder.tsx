import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font, radius, space, typography } from '@/shared/theme';
import { Group, GroupLabel, Stepper } from '@/shared/components/ui';
import { Meals } from '@/domain/food/models/meals';
import { useFood } from '@/domain/food/FoodContext';
import { MealPicker } from '@/food/components/MealPicker/MealPicker';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import {
  itemsToEntries,
  scaleServings,
  type SavedMealItem,
} from '@/domain/saved-meals/models/savedMeals';
import { loggedAsResult } from '../../models/recentFoods';
import { scaledTotals, stepScale } from '@/domain/food/models/mealDraft';
import type { LogFoodStackParamList } from '../../navigation';
import ItemRow from '@/food/components/ItemRow/ItemRow';

type Nav = NativeStackNavigationProp<LogFoodStackParamList>;

/**
 * The state behind adding a past or saved meal to today: which meal it goes into, the portion
 * scale (0.5 = half portions), and the two ways to add it (all of it, or one food to tweak first).
 */
export function useMealAdder(
  items: SavedMealItem[],
  initialMeal: Parameters<typeof itemsToEntries>[1],
  navigation: Nav,
) {
  const { addFoodEntries } = useFood();
  const { showCalories } = useFoodDisplay();
  const [target, setTarget] = useState(initialMeal);
  const [scale, setScale] = useState(1);

  const totals = scaledTotals(items, scale);
  const summary =
    `${items.length} ${items.length === 1 ? 'food' : 'foods'}` +
    (showCalories ? ` · ${Math.round(totals.calories)} cal` : '') +
    ` · ${Math.round(totals.protein)}g protein`;

  const add = () => {
    addFoodEntries(itemsToEntries(items, target, scale));
    navigation.goBack();
  };

  // Just this food: the Details screen, starting from the amount it has here, so it can be changed first.
  const addOne = (index: number) => {
    const [entry] = itemsToEntries([items[index]], target, scale);
    navigation.navigate('FoodDetail', {
      meal: target,
      result: loggedAsResult(entry),
    });
  };

  return { target, setTarget, scale, setScale, summary, add, addOne };
}

/** The foods in a meal, the portion stepper, the meal to add to, and the Add button. */
export function MealAdder({
  items,
  adder,
  itemsLabel,
  scaleNoun,
}: {
  items: SavedMealItem[];
  adder: ReturnType<typeof useMealAdder>;
  /** Heading over the foods, e.g. "What you had". */
  itemsLabel: string;
  /** What the portion is relative to: "logged" or "saved". */
  scaleNoun: string;
}) {
  const { target, setTarget, scale, setScale, add, addOne } = adder;
  const targetLabel =
    Meals.OPTIONS.find((m) => m.key === target)?.label ?? target;
  return (
    <>
      <GroupLabel>{`${itemsLabel} · tap a food to add just that`}</GroupLabel>
      <Group>
        {items.map((item, i) => (
          <ItemRow
            key={`${item.name}-${i}`}
            item={{ ...item, servings: scaleServings(item.servings, scale) }}
            onPress={() => addOne(i)}
          />
        ))}
      </Group>

      <GroupLabel>Portion</GroupLabel>
      <View style={[s.card, s.scaleRow]}>
        <View style={{ flex: 1 }}>
          <Text style={s.scaleTitle}>
            {scale === 1 ? `As ${scaleNoun}` : `${scale}× as ${scaleNoun}`}
          </Text>
          <Text style={s.scaleSub}>Scales every food in this meal</Text>
        </View>
        <Stepper
          value={`${scale}×`}
          onDecrement={() => setScale((v) => stepScale(v, -1))}
          onIncrement={() => setScale((v) => stepScale(v, 1))}
          decrementLabel='Smaller portion'
          incrementLabel='Larger portion'
          valueMinWidth={44}
        />
      </View>

      <GroupLabel>Add to</GroupLabel>
      <View style={s.card}>
        <MealPicker
          value={target}
          onChange={setTarget}
          options={Meals.OPTIONS}
        />
      </View>

      <Pressable style={s.bigBtn} onPress={add}>
        <Text style={s.bigBtnText}>Add all to {targetLabel.toLowerCase()}</Text>
      </Pressable>
    </>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
  },
  bigBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: space.lg,
  },
  bigBtnText: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
  scaleRow: { flexDirection: 'row', alignItems: 'center' },
  scaleTitle: typography.rowTitle,
  scaleSub: { ...typography.caption, marginTop: 1 },
});
