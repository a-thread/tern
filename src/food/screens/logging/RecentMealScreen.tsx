import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, SheetNav, Stepper } from '@shared/components/ui';
import { Meals } from '@food/models/meals';
import { useFood } from '@food/FoodContext';
import { MealPicker } from '@food/components/MealPicker';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import { useLoggedFoods } from '@food/hooks/useLoggedFoods';
import { itemsToEntries, scaleServings } from '@food/models/savedMeals';
import { loggedAsResult } from '@food/models/recentFoods';
import { scaledTotals, stepScale } from '@food/models/mealDraft';
import type { LogFoodStackParamList } from '@food/navigation';
import ItemRow from '@food/components/ItemRow';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'RecentMeal'>;

/** A meal you've already logged: what was in it, and one tap to log it again. */
export default function RecentMealScreen({ navigation, route }: Props) {
  const { meal: initialMeal, recentId } = route.params;
  const insets = useSafeAreaInsets();
  const { addFoodEntries } = useFood();
  const { meals, loaded } = useLoggedFoods();
  const { showCalories } = useFoodDisplay();
  const recent = meals.find((m) => m.id === recentId);

  const [target, setTarget] = useState(initialMeal);
  // Scales every food when adding (0.5 = half portions); the day it came from is unchanged.
  const [scale, setScale] = useState(1);

  if (!recent) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
        <SheetNav title='Recent meal' leftLabel='Back' onLeftPress={() => navigation.goBack()} />
        {loaded ? (
          <Text style={s.gone}>This meal isn’t in your log any more.</Text>
        ) : (
          <ActivityIndicator style={{ marginTop: space.xl }} color={colors.ink3} />
        )}
      </View>
    );
  }

  const totals = scaledTotals(recent.items, scale);
  const targetLabel = Meals.OPTIONS.find((m) => m.key === target)?.label ?? target;

  const add = () => {
    addFoodEntries(itemsToEntries(recent.items, target, scale));
    navigation.goBack();
  };

  // Just this food: the Details screen, starting from the amount it had here, so it can be changed first.
  const addOne = (index: number) => {
    const [entry] = itemsToEntries([recent.items[index]], target, scale);
    navigation.navigate('FoodDetail', { meal: target, result: loggedAsResult(entry) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <SheetNav
        title='Recent meal'
        leftLabel='Back'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Add'
        onRightPress={add}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps='handled'
      >
        <View style={s.head}>
          <Text style={s.name}>{recent.title}</Text>
          <Text style={s.sub}>
            {recent.items.length} {recent.items.length === 1 ? 'food' : 'foods'}
            {showCalories ? ` · ${Math.round(totals.calories)} cal` : ''}
            {` · ${Math.round(totals.protein)}g protein`}
          </Text>
        </View>

        <GroupLabel>What you had · tap a food to add just that</GroupLabel>
        <Group>
          {recent.items.map((item, i) => (
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
              {scale === 1 ? 'As logged' : `${scale}× as logged`}
            </Text>
            <Text style={s.scaleSub}>Scales every food in this meal</Text>
          </View>
          <Stepper value={`${scale}×`} onDecrement={() => setScale((v) => stepScale(v, -1))} onIncrement={() => setScale((v) => stepScale(v, 1))} decrementLabel='Smaller portion' incrementLabel='Larger portion' valueMinWidth={44} />
        </View>

        <GroupLabel>Add to</GroupLabel>
        <View style={s.card}>
          <MealPicker value={target} onChange={setTarget} options={Meals.OPTIONS} />
        </View>

        <Pressable style={s.bigBtn} onPress={add}>
          <Text style={s.bigBtnText}>Add all to {targetLabel.toLowerCase()}</Text>
        </Pressable>

        <Text style={s.note}>
          Adding this doesn’t change the day it came from.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingVertical: space.md },
  name: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  sub: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2, marginTop: 4 },
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
  scaleTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  scaleSub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2, marginTop: 1 },
  note: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink2,
    textAlign: 'center',
    paddingTop: space.lg,
  },
  gone: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    textAlign: 'center',
    padding: space.xl,
  },
});
