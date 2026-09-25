import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { MEAL_OPTIONS } from '../models';
import { useFood } from '../FoodContext';
import { MealPicker } from '../components';
import { useFoodDisplay } from '../useFoodDisplay';
import { useLoggedFoods } from '../useLoggedFoods';
import { itemsToEntries, scaleServings } from '../savedMeals';
import { scaledTotals, stepScale } from '../mealDraft';
import type { LogFoodStackParamList } from '../types';
import ItemRow from './ItemRow';

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
  const targetLabel = MEAL_OPTIONS.find((m) => m.key === target)?.label ?? target;

  const add = () => {
    addFoodEntries(itemsToEntries(recent.items, target, scale));
    navigation.goBack();
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

        <GroupLabel>What you had</GroupLabel>
        <Group>
          {recent.items.map((item, i) => (
            <ItemRow
              key={`${item.name}-${i}`}
              item={{ ...item, servings: scaleServings(item.servings, scale) }}
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
          <View style={s.stepper}>
            <Pressable onPress={() => setScale((v) => stepScale(v, -1))} hitSlop={8} accessibilityLabel='Smaller portion'>
              <Text style={s.stepperBtn}>−</Text>
            </Pressable>
            <Text style={s.stepperVal}>{scale}×</Text>
            <Pressable onPress={() => setScale((v) => stepScale(v, 1))} hitSlop={8} accessibilityLabel='Larger portion'>
              <Text style={s.stepperBtn}>+</Text>
            </Pressable>
          </View>
        </View>

        <GroupLabel>Add to</GroupLabel>
        <View style={s.card}>
          <MealPicker value={target} onChange={setTarget} options={MEAL_OPTIONS} />
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E5DD',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepperBtn: {
    fontFamily: font.body,
    fontSize: 17,
    color: colors.coral,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepperVal: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
    minWidth: 44,
    textAlign: 'center',
  },
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
