import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space, typography } from '@shared/theme';
import { Group, GroupLabel, SheetNav, Stepper } from '@shared/components/ui';
import { Meals } from '@/domain/food/models/meals';
import type { Tier } from '@/domain/food/models/foodEntry';
import { useFood } from '@/domain/food/FoodContext';
import { useSavedMeals } from '@/domain/saved-meals/SavedMealsContext';
import { TierPicker } from '../../components/TierPicker/TierPicker';
import { FoodTypeLabel } from '../../components/FoodTypeLabel/FoodTypeLabel';
import { MeasurePicker } from '../../components/MeasurePicker/MeasurePicker';
import { MealPicker } from '../../components/MealPicker/MealPicker';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import {
  gramsOf,
  scaleForGrams,
  stepServings,
  Servings,
} from '@/domain/food/models/servings';
import {
  addPortions,
  amountOf,
  amountText,
  measureGrams,
  startingMeasure,
  type Measure,
} from '@/domain/food/models/measure';
import { logFoodApi, portionsText } from '@/domain/food/sources/foodApiLog';
import { useFoodSizes } from '../hooks/useFoodSizes';
import type { LogFoodStackParamList } from '../navigation';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'FoodDetail'>;

export default function FoodDetailScreen({ navigation, route }: Props) {
  const { meal: initialMeal, result: searched, pick } = route.params;
  // Sizes search left out: already here if the list fetched them, else on their way.
  const { food: result, loading: sizesLoading } = useFoodSizes(searched);
  const insets = useSafeAreaInsets();
  const { addFoodEntry } = useFood();
  const { addDraftItem } = useSavedMeals();
  const { showTiers, showTierNumber, showCalories, showMacros } =
    useFoodDisplay();

  // Foods sized in grams ("100 g", the usual Open Food Facts unit) are logged by
  // amount: pick a household unit ("large egg", "cup") and how many, or type a
  // weight. Anything else ("1 bar") uses servings.
  const baseGrams = gramsOf(result.servingLabel);
  const { units } = useUnits();
  const [measure, setMeasure] = useState<Measure | null>(() =>
    baseGrams !== null ? startingMeasure(result, baseGrams, units) : null,
  );
  // Development only: the portions this food arrived with and the units the picker ended up offering.
  useEffect(() => {
    logFoodApi(`Opened "${result.name}" (${result.source ?? 'logged'})`, [
      `from source: ${portionsText(result.portions)}`,
      `picker offers: ${measure ? portionsText(measure.portions) : `servings of ${result.servingLabel}`}`,
      `starts on: ${measure ? `${measure.quantity} ${measure.unit ?? 'g'}` : `${result.servings ?? 1} × ${result.servingLabel}`}`,
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sizes that arrive after opening: until the amount is touched the food starts over on its
  // first size ("1 packet"); after that (they came late) they're only added to the choices.
  // Done while rendering, not in an effect, so no frame is ever drawn with the old units.
  const touched = useRef(false);
  const [settledFor, setSettledFor] = useState(result);
  if (settledFor !== result) {
    setSettledFor(result);
    if (measure && baseGrams !== null && result.portions?.length)
      setMeasure(
        touched.current
          ? addPortions(measure, result.portions)
          : startingMeasure(result, baseGrams, units),
      );
  }
  const changeMeasure = (next: Measure) => {
    touched.current = true;
    setMeasure(next);
  };
  const gramsValue = measure ? measureGrams(measure) : null;
  const [servings, setServings] = useState(result.servings ?? 1);
  const [servingLabel, setServingLabel] = useState(result.servingLabel);
  const [meal, setMeal] = useState(initialMeal);
  // A food with no processing data starts with no type chosen: we ask rather than guess.
  const [tier, setTier] = useState<Tier | null>(result.tier);
  const needsTier = showTiers && tier === null;
  const needsAmount = measure !== null && (gramsValue ?? 0) <= 0;
  const blocked = needsTier || needsAmount || sizesLoading;

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
          {result.brand || result.detail ? (
            <Text style={s.brand}>{result.brand ?? result.detail}</Text>
          ) : null}
        </View>

        {/* No card at all when neither calories nor macros are shown. */}
        {showCalories || showMacros ? (
          <View style={s.calCard}>
            {showCalories ? (
              <View>
                <Text style={s.calBig}>
                  {sizesLoading ? '–' : Math.round(shown.calories)}
                </Text>
                <Text style={s.calLabel}>calories</Text>
              </View>
            ) : null}
            {showMacros ? (
              <View style={s.macroMini}>
                <MacroMini
                  value={sizesLoading ? null : shown.protein}
                  label='protein'
                />
                <MacroMini
                  value={sizesLoading ? null : shown.carbs}
                  label='carbs'
                />
                <MacroMini value={sizesLoading ? null : shown.fat} label='fat' />
              </View>
            ) : null}
          </View>
        ) : null}

        <GroupLabel>Portion</GroupLabel>
        {sizesLoading ? (
          <Group>
            <View style={s.row} accessibilityLiveRegion='polite'>
              <ActivityIndicator size='small' color={colors.ink3} />
              <Text style={s.loadingText}>Finding serving sizes…</Text>
            </View>
          </Group>
        ) : measure ? (
          <MeasurePicker
            // A fresh picker once the sizes arrive, so its typed amount follows the new start.
            key={result === searched ? 'searched' : 'with-sizes'}
            measure={measure}
            onChange={changeMeasure}
          />
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
            <FoodTypeLabel />
            <View style={s.card}>
              <TierPicker
                value={tier}
                onChange={setTier}
                suggested={result.tier}
                suggestedBy={result.source}
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
            {sizesLoading
              ? 'Finding serving sizes…'
              : needsAmount
                ? 'Enter an amount to add'
              : needsTier
                ? 'Choose a food type to add'
                : `Add ${measure ? `${amountText(measure)} ` : ''}to ${pick ? 'meal' : meal}`}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** One macro in grams, or a dash while the amount isn't settled. */
function MacroMini({ value, label }: { value: number | null; label: string }) {
  return (
    <View>
      <Text style={s.macroVal}>
        {value === null ? '–' : `${Math.round(value)}g`}
      </Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingVertical: space.md },
  loadingText: { ...typography.meta, flex: 1 },
  name: {
    fontFamily: font.display,
    fontSize: 21,
    color: colors.ink,
    lineHeight: 26,
  },
  brand: { ...typography.meta, marginTop: 3 },
  calCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  calBig: { fontFamily: font.displayMedium, fontSize: 32, color: colors.ink },
  calLabel: typography.caption,
  macroMini: { flexDirection: 'row', gap: 16 },
  macroVal: {
    fontFamily: font.bold,
    fontSize: 13.5,
    color: colors.ink,
    textAlign: 'center',
  },
  macroLabel: { ...typography.small, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 8,
  },
  rowTitle: typography.rowTitle,
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
  bigBtnText: { fontFamily: font.bold, fontSize: 14.5, color: colors.onAction },
});
