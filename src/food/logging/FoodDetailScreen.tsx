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
import { TierPicker, MealPicker } from '../components';
import { useFoodDisplay } from '../useFoodDisplay';
import type { LogFoodStackParamList } from '../types';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'FoodDetail'>;

export default function FoodDetailScreen({ navigation, route }: Props) {
  const { meal: initialMeal, result } = route.params;
  const insets = useSafeAreaInsets();
  const { addFoodEntry } = useFood();
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();

  const [servings, setServings] = useState(1);
  const [servingLabel, setServingLabel] = useState(result.servingLabel);
  const [meal, setMeal] = useState(initialMeal);
  const [tier, setTier] = useState<Tier>((result.tier ?? 1) as Tier);

  const step = (delta: number) =>
    setServings((s) => Math.max(0.5, Math.round((s + delta) * 2) / 2));

  const add = () => {
    addFoodEntry({
      name: result.name,
      brand: result.brand,
      meal,
      servings,
      servingLabel: servingLabel.trim() || result.servingLabel,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      tier,
      tierOverridden: tier !== result.tier,
    });
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
        onRightPress={add}
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
              <Text style={s.calBig}>
                {Math.round(result.calories * servings)}
              </Text>
              <Text style={s.calLabel}>calories</Text>
            </View>
          ) : null}
          <View style={s.macroMini}>
            <MacroMini value={result.protein * servings} label='protein' />
            <MacroMini value={result.carbs * servings} label='carbs' />
            <MacroMini value={result.fat * servings} label='fat' />
          </View>
        </View>

        <GroupLabel>Portion</GroupLabel>
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
        </Group>

        <GroupLabel>Meal</GroupLabel>
        <View style={s.card}>
          <MealPicker value={meal} onChange={setMeal} options={MEAL_OPTIONS} />
        </View>

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

        <Pressable style={s.bigBtn} onPress={add}>
          <Text style={s.bigBtnText}>Add to {meal}</Text>
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
