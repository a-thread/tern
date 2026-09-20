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
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { MEAL_OPTIONS, type Tier } from '../models';
import { useFood } from '../FoodContext';
import { useSavedMeals } from '../SavedMealsContext';
import { TierPicker, MealPicker } from '../components';
import { useFoodDisplay } from '../useFoodDisplay';
import {
  gramsOf,
  parseGrams,
  portionGrams,
  portionServingLabel,
  scaleForGrams,
} from '../servings';
import type { LogFoodStackParamList } from '../types';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'FoodDetail'>;

export default function FoodDetailScreen({ navigation, route }: Props) {
  const { meal: initialMeal, result, pick } = route.params;
  const insets = useSafeAreaInsets();
  const { addFoodEntry } = useFood();
  const { addDraftItem } = useSavedMeals();
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();

  // Foods sized in grams ("100 g", the usual Open Food Facts unit) are logged by
  // weight: type how much you ate. Anything else ("1 bar") uses servings.
  const baseGrams = gramsOf(result.servingLabel);
  const [grams, setGrams] = useState(baseGrams !== null ? String(baseGrams) : '');
  // Household portions ("1 medium", "1 cup") when the database has them: pick one
  // and how many, or switch to typing grams.
  const portions = baseGrams !== null ? (result.portions ?? []) : [];
  const [portionIndex, setPortionIndex] = useState<number | null>(
    portions.length ? 0 : null,
  );
  const [count, setCount] = useState(1);
  const portion = portionIndex !== null ? portions[portionIndex] : null;
  const gramsValue = portion ? portionGrams(portion, count) : parseGrams(grams);
  const [servings, setServings] = useState(1);
  const [servingLabel, setServingLabel] = useState(result.servingLabel);
  const [meal, setMeal] = useState(initialMeal);
  // A food with no processing data starts with no type chosen: we ask rather than guess.
  const [tier, setTier] = useState<Tier | null>(result.tier);
  const needsTier = showTiers && tier === null;
  const needsAmount = baseGrams !== null && gramsValue === null;
  const blocked = needsTier || needsAmount;

  // What is being logged, scaled to the amount eaten.
  const shown =
    baseGrams !== null
      ? scaleForGrams(result, baseGrams, gramsValue ?? 0)
      : {
          calories: result.calories * servings,
          protein: result.protein * servings,
          carbs: result.carbs * servings,
          fat: result.fat * servings,
        };

  const step = (delta: number) =>
    setServings((s) => Math.max(0.5, Math.round((s + delta) * 2) / 2));
  const stepCount = (delta: number) =>
    setCount((c) => Math.max(0.5, Math.round((c + delta) * 2) / 2));
  // Switching to grams keeps the weight you had chosen.
  const chooseGrams = () => {
    if (gramsValue !== null) setGrams(String(gramsValue));
    setPortionIndex(null);
  };

  const add = () => {
    if (blocked) return;
    // By weight: one serving of exactly the amount eaten. Otherwise as entered.
    const amount =
      baseGrams !== null && gramsValue !== null
        ? {
            servings: 1,
            servingLabel: portion
              ? portionServingLabel(portion, count)
              : `${gramsValue} g`,
            ...scaleForGrams(result, baseGrams, gramsValue),
          }
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
      navigation.navigate('MealEditor');
      return;
    }
    addFoodEntry({ ...food, meal });
    navigation.getParent()?.goBack();
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
        <Group>
          {baseGrams !== null ? (
            <>
              {portions.length ? (
                <View style={s.chips}>
                  {portions.map((p, i) => (
                    <Pressable
                      key={`${p.label}-${i}`}
                      onPress={() => {
                        setPortionIndex(i);
                        setCount(1);
                      }}
                      style={[s.chip, portionIndex === i && s.chipOn]}
                    >
                      <Text
                        style={[s.chipText, portionIndex === i && s.chipTextOn]}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={chooseGrams}
                    style={[s.chip, portionIndex === null && s.chipOn]}
                  >
                    <Text
                      style={[s.chipText, portionIndex === null && s.chipTextOn]}
                    >
                      Grams
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {portion ? (
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>How many</Text>
                    <Text style={s.weightNote}>= {gramsValue} g</Text>
                  </View>
                  <View style={s.stepper}>
                    <Pressable onPress={() => stepCount(-0.5)} hitSlop={8}>
                      <Text style={s.stepperBtn}>−</Text>
                    </Pressable>
                    <Text style={s.stepperVal}>{count}</Text>
                    <Pressable onPress={() => stepCount(0.5)} hitSlop={8}>
                      <Text style={s.stepperBtn}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={s.row}>
                  <Text style={[s.rowTitle, { flex: 1 }]}>Amount</Text>
                  <TextInput
                    value={grams}
                    onChangeText={(v) => setGrams(v.replace(/[^0-9.,]/g, ''))}
                    keyboardType='decimal-pad'
                    selectTextOnFocus
                    maxLength={6}
                    placeholder={String(baseGrams)}
                    placeholderTextColor={colors.ink3}
                    accessibilityLabel='Amount in grams'
                    style={[s.rowInput, { minWidth: 70 }]}
                  />
                  <Text style={s.rowTitle}>g</Text>
                </View>
              )}
            </>
          ) : (
            <>
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
                <View style={s.stepper}>
                  <Pressable onPress={() => step(-0.5)} hitSlop={8}>
                    <Text style={s.stepperBtn}>−</Text>
                  </Pressable>
                  <Text style={s.stepperVal}>{servings}</Text>
                  <Pressable onPress={() => step(0.5)} hitSlop={8}>
                    <Text style={s.stepperBtn}>+</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </Group>

        {pick ? null : (
          <>
            <GroupLabel>Meal</GroupLabel>
            <View style={s.card}>
              <MealPicker value={meal} onChange={setMeal} options={MEAL_OPTIONS} />
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.doveTint,
  },
  chipOn: { backgroundColor: colors.ink },
  chipText: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink2 },
  chipTextOn: { color: colors.paper },
  weightNote: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 1,
  },
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
    fontSize: 13.5,
    color: colors.ink,
    minWidth: 40,
    textAlign: 'center',
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
