import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, SheetNav, Stepper } from '@shared/components/ui';
import { Meals } from '@food/models/meals';
import type { Tier } from '@food/models/foodEntry';
import { useFood } from '@food/FoodContext';
import { useSavedMeals } from '@food/SavedMealsContext';
import { TierPicker } from '@food/components/TierPicker';
import { MeasurePicker } from '@food/components/MeasurePicker';
import { MealPicker } from '@food/components/MealPicker';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import {
  gramsOf,
  scaleForGrams,
  stepServings,
  Servings,
} from '@food/models/servings';
import {
  amountOf,
  measureGrams,
  startingMeasure,
  type Measure,
} from '@food/models/measure';
import type { LogFoodStackParamList } from '@food/navigation';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'FoodDetail'>;

export default function FoodDetailScreen({ navigation, route }: Props) {
  const { meal: initialMeal, result, pick } = route.params;
  const insets = useSafeAreaInsets();
  const { addFoodEntry } = useFood();
  const { addDraftItem } = useSavedMeals();
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();

  // Foods sized in grams ("100 g", the usual Open Food Facts unit) are logged by
  // amount: pick a household unit ("large egg", "cup") and how many, or type a
  // weight. Anything else ("1 bar") uses servings.
  const baseGrams = gramsOf(result.servingLabel);
  const [measure, setMeasure] = useState<Measure | null>(() =>
    baseGrams !== null ? startingMeasure(result, baseGrams) : null,
  );
  const gramsValue = measure ? measureGrams(measure) : null;
  const [servings, setServings] = useState(1);
  const [servingLabel, setServingLabel] = useState(result.servingLabel);
  const [meal, setMeal] = useState(initialMeal);
  // A food with no processing data starts with no type chosen: we ask rather than guess.
  const [tier, setTier] = useState<Tier | null>(result.tier);
  const needsTier = showTiers && tier === null;
  const needsAmount = measure !== null && (gramsValue ?? 0) <= 0;
  const blocked = needsTier || needsAmount;

  // What is being logged, scaled to the amount eaten.
  const shown = measure
    ? scaleForGrams(measure.per100, 100, gramsValue ?? 0)
    : {
        calories: result.calories * servings,
        protein: result.protein * servings,
        carbs: result.carbs * servings,
        fat: result.fat * servings,
      };

  const step = (delta: number) => setServings((s) => stepServings(s, delta));
  const add = () => {
    if (blocked) return;
    // With a measure: one serving of exactly the amount eaten. Otherwise as entered.
    const amount = measure
      ? amountOf(measure)
      : {
          servings,
          servingLabel: servingLabel.trim() || result.servingLabel,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
        };
    const food = {
      name: result.name,
      brand: result.brand,
      ...amount,
      // With food types hidden in Settings there's no picker, so an unknown type is stored as 1.
      tier: tier ?? 1,
      tierOverridden: result.tier !== null && tier !== result.tier,
    };
    if (pick) {
      // Building a saved meal: the food goes into the meal being edited, not today's log.
      addDraftItem(food);
      // Back to the editor already open underneath, not a second copy of it.
      navigation.popTo('MealEditor');
      return;
    }
    addFoodEntry({ ...food, meal });
    // One screen back (the search, or the scanner), so more foods can be added.
    navigation.goBack();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='Details'
        leftLabel='Back'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Add'
        onRightPress={blocked ? undefined : add}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps='handled'
      >
        <View style={s.head}>
          <Text style={s.name}>{result.name}</Text>
          {result.brand ? <Text style={s.brand}>{result.brand}</Text> : null}
        </View>

        <View style={s.calCard}>
          {showCalories ? (
            <View>
              <Text style={s.calBig}>{Math.round(shown.calories)}</Text>
              <Text style={s.calLabel}>calories</Text>
            </View>
          ) : null}
          <View style={s.macroMini}>
            <MacroMini value={shown.protein} label='protein' />
            <MacroMini value={shown.carbs} label='carbs' />
            <MacroMini value={shown.fat} label='fat' />
          </View>
        </View>

        <GroupLabel>Portion</GroupLabel>
        {measure ? (
          <MeasurePicker measure={measure} onChange={setMeasure} />
        ) : (
          <Group>
            <View style={s.row}>
              <Text style={s.rowTitle}>Serving size</Text>
              <TextInput
                value={servingLabel}
                onChangeText={setServingLabel}
                placeholder={result.servingLabel}
                placeholderTextColor={colors.ink3}
                style={s.rowInput}
              />
            </View>
            <View style={s.row}>
              <Text style={[s.rowTitle, { flex: 1 }]}>Servings</Text>
              <Stepper
                value={servings}
                onDecrement={() => step(-Servings.STEP)}
                onIncrement={() => step(Servings.STEP)}
              />
            </View>
          </Group>
        )}

        {pick ? null : (
          <>
            <GroupLabel>Meal</GroupLabel>
            <View style={s.card}>
              <MealPicker
                value={meal}
                onChange={setMeal}
                options={Meals.OPTIONS}
              />
            </View>
          </>
        )}

        {showTiers ? (
          <>
            <GroupLabel>Food type</GroupLabel>
            <View style={s.card}>
              <TierPicker
                value={tier}
                onChange={setTier}
                suggested={result.tier}
                showNumber={showTierNumber}
              />
            </View>
          </>
        ) : null}

        <Pressable
          style={[s.bigBtn, blocked && { opacity: 0.45 }]}
          onPress={add}
          disabled={blocked}
        >
          <Text style={s.bigBtnText}>
            {needsAmount
              ? 'Enter an amount to add'
              : needsTier
                ? 'Choose a food type to add'
                : pick
                  ? 'Add to meal'
                  : `Add to ${meal}`}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MacroMini({ value, label }: { value: number; label: string }) {
  return (
    <View>
      <Text style={s.macroVal}>{Math.round(value)}g</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingVertical: space.md },
  name: {
    fontFamily: font.display,
    fontSize: 21,
    color: colors.ink,
    lineHeight: 26,
  },
  brand: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: colors.ink2,
    marginTop: 3,
  },
  calCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  calBig: { fontFamily: font.displayMedium, fontSize: 32, color: colors.ink },
  calLabel: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
  macroMini: { flexDirection: 'row', gap: 16 },
  macroVal: {
    fontFamily: font.bold,
    fontSize: 13.5,
    color: colors.ink,
    textAlign: 'center',
  },
  macroLabel: {
    fontFamily: font.body,
    fontSize: 11,
    color: colors.ink2,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 8,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowInput: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    padding: 0,
    textAlign: 'right',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
  },
  bigBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg - 1,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: space.lg,
  },
  bigBtnText: { fontFamily: font.bold, fontSize: 14.5, color: '#fff' },
});
