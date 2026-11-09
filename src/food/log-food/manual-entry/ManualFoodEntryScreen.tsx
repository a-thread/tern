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

import { colors, font, radius, space, typography } from '@shared/theme';
import {
  FootNote,
  Group,
  GroupLabel,
  SheetNav,
  ToggleRow,
} from '@shared/components/ui';
import { Units } from '@shared/utils/units';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { weightGrams, WeightUnit } from '@/domain/food/models/weight';
import {
  SavedMealLimits,
  typedYield,
} from '@/domain/saved-meals/models/savedMeals';
import {
  batchItem,
  homemadeEntry,
  homemadeItem,
  numberChars,
  typedNutrient,
  perServing,
  typedServingGrams,
  type Homemade,
} from './models/homemade';
import type { Tier } from '@/domain/food/models/foodEntry';
import { useFood } from '@/domain/food/FoodContext';
import { useSavedMeals } from '@/domain/saved-meals/SavedMealsContext';
import { TierPicker } from '../../components/TierPicker/TierPicker';
import { FoodTypeLabel } from '../../components/FoodTypeLabel/FoodTypeLabel';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import type { LogFoodStackParamList } from '../navigation';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'ManualFoodEntry'>;

export default function ManualFoodEntryScreen({ navigation, route }: Props) {
  const { meal, name: initialName, pick } = route.params;
  const insets = useSafeAreaInsets();
  const { addFoodEntry } = useFood();
  const { addDraftItem, saveRecipe } = useSavedMeals();
  const { showTiers, showTierNumber, tracksCalories, showMacros } =
    useFoodDisplay();
  // Calories or macros are asked for; without them, the screen is just a name and a serving.
  const tracksNumbers = tracksCalories || showMacros;
  const { units } = useUnits();
  // A serving's weight is typed in the person's own unit.
  const weightUnit = units === Units.Imperial ? WeightUnit.Oz : null;
  const gramsPerUnit = weightUnit ? weightGrams(weightUnit) : 1;

  const [name, setName] = useState(initialName ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  // Left blank, a serving is saved as "1 serving".
  const [serving, setServing] = useState('');
  const [makes, setMakes] = useState('');
  const [weighs, setWeighs] = useState('');
  const [asRecipe, setAsRecipe] = useState(true);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  // No type chosen for you: asked for only when food types are tracked, as on the details screen.
  const [tier, setTier] = useState<Tier | null>(null);
  const needsTier = showTiers && tier === null;

  // A batch only when logging (a food added to a meal being built is one serving of it).
  const typedMakes = parseInt(makes, 10);
  const makesError =
    !pick &&
    makes.trim() &&
    !(typedMakes >= 1 && typedMakes <= SavedMealLimits.MAX_SERVINGS)
      ? `Enter a whole number from 1 to ${SavedMealLimits.MAX_SERVINGS}.`
      : null;
  const makesN = pick || makesError ? 1 : (typedYield(makes) ?? 1);
  const servingGrams = typedServingGrams(weighs, gramsPerUnit);
  const weighsError =
    weighs.trim() && servingGrams === null
      ? 'Enter what one serving weighs.'
      : null;
  const batch = makesN > 1;
  const homemade: Homemade = {
    name,
    serving,
    makes: makesN,
    servingGrams,
    totals: {
      calories: typedNutrient(calories),
      protein: typedNutrient(protein),
      carbs: typedNutrient(carbs),
      fat: typedNutrient(fat),
    },
    // With food types hidden in Settings there's no picker, so an unknown type is stored as 1.
    tier: tier ?? 1,
  };
  const each = perServing(homemade);
  const eachLine = [
    tracksCalories ? `${each.calories} cal` : null,
    ...(showMacros
      ? [
          `${each.protein}g protein`,
          `${each.carbs}g carbs`,
          `${each.fat}g fat`,
        ]
      : []),
  ]
    .filter(Boolean)
    .join(' · ');

  const canSave =
    name.trim().length > 0 && !makesError && !weighsError && !needsTier;

  const save = () => {
    if (!canSave) return;
    if (pick) {
      // Building a saved meal: add to the meal being edited, not today's log.
      addDraftItem(homemadeItem(homemade));
      // Back to the editor already open underneath, not a second copy of it.
      navigation.popTo('MealEditor');
      return;
    }
    if (batch && asRecipe) {
      // Kept in Meals so the rest of the batch can be logged by the serving.
      const saved = saveRecipe(name, batchItem(homemade), makesN);
      if (!saved.ok) {
        setNameError(saved.error);
        return;
      }
    }
    addFoodEntry(homemadeEntry(homemade, meal));
    navigation.goBack();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='New food'
        leftLabel='Cancel'
        onLeftPress={() =>
          pick ? navigation.goBack() : navigation.getParent()?.goBack()
        }
        rightLabel={pick ? 'Add' : 'Save'}
        onRightPress={save}
        rightDisabled={!canSave}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps='handled'
      >
        {tracksNumbers ? (
          <Text style={s.intro}>
            Homemade or missing from the database? Add what you know — you can
            leave the numbers blank and still log it.
          </Text>
        ) : null}

        <GroupLabel>Basics</GroupLabel>
        <Group>
          <FieldRow
            label='Name'
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameError(null);
            }}
            placeholder='Required'
            error={nameError}
          />
          {/* What one serving is, as on a nutrition label: "1 bowl", "2 cups". */}
          <FieldRow
            label='Serving size'
            value={serving}
            onChangeText={setServing}
            placeholder='1 bowl'
          />
          {/* A weight is for logging by the ounce or gram, which only matters with numbers. */}
          {tracksNumbers ? (
            <FieldRow
              label='Serving weighs'
              value={weighs}
              onChangeText={(v) => setWeighs(numberChars(v))}
              keyboardType='numeric'
              placeholder='optional'
              suffix={weightUnit ?? 'g'}
              suffixAlways
              accessibilityLabel={`What one serving weighs, in ${weightUnit ? 'ounces' : 'grams'}`}
              error={weighsError}
            />
          ) : null}
          {pick ? null : (
            <FieldRow
              label='Recipe makes'
              value={makes}
              onChangeText={(v) => setMakes(v.replace(/[^0-9]/g, ''))}
              keyboardType='numeric'
              placeholder='optional'
              suffix={makesN === 1 ? 'serving' : 'servings'}
              suffixAlways
              accessibilityLabel='How many servings it makes'
              error={makesError}
            />
          )}
        </Group>
        {tracksNumbers ? (
          <FootNote>
            {batch
              ? 'For a pot of chili or a tray of bars: enter the numbers for the whole batch and it works out a serving.'
              : 'With its weight, you can log it by the ounce or gram later.'}
          </FootNote>
        ) : null}

        {/* Calories are asked for whenever they're tracked, even with counts hidden, so a
            hidden field never saves a zero into the log. */}
        {tracksCalories || showMacros ? (
          <>
            <GroupLabel>
              {batch
                ? 'Nutrition for the whole batch (optional)'
                : 'Nutrition (optional)'}
            </GroupLabel>
            <Group>
              {tracksCalories ? (
                <FieldRow
                  key='calories'
                  label='Calories'
                  value={calories}
                  onChangeText={(v) => setCalories(numberChars(v))}
                  keyboardType='numeric'
                  placeholder='—'
                />
              ) : null}
              {showMacros ? (
                <FieldRow
                  key='protein'
                  label='Protein'
                  value={protein}
                  onChangeText={(v) => setProtein(numberChars(v))}
                  keyboardType='numeric'
                  placeholder='—'
                  suffix='g'
                  suffixAlways
                />
              ) : null}
              {showMacros ? (
                <FieldRow
                  key='carbs'
                  label='Carbs'
                  value={carbs}
                  onChangeText={(v) => setCarbs(numberChars(v))}
                  keyboardType='numeric'
                  placeholder='—'
                  suffix='g'
                  suffixAlways
                />
              ) : null}
              {showMacros ? (
                <FieldRow
                  key='fat'
                  label='Fat'
                  value={fat}
                  onChangeText={(v) => setFat(numberChars(v))}
                  keyboardType='numeric'
                  placeholder='—'
                  suffix='g'
                  suffixAlways
                />
              ) : null}
            </Group>
            {batch && eachLine ? (
              <FootNote>{`One serving: ${eachLine}`}</FootNote>
            ) : null}
          </>
        ) : null}

        {batch ? (
          <>
            <GroupLabel>Recipe</GroupLabel>
            <Group>
              <ToggleRow
                title='Save as a recipe'
                sub={`Keeps it in Meals, so the rest of the ${makesN} servings can be logged later.`}
                on={asRecipe}
                onToggle={setAsRecipe}
              />
            </Group>
          </>
        ) : null}

        {showTiers ? (
          <>
            <FoodTypeLabel />
            <View style={s.card}>
              <TierPicker
                value={tier}
                onChange={setTier}
                showNumber={showTierNumber}
              />
            </View>
          </>
        ) : null}

        <Pressable
          style={[s.bigBtn, !canSave && { opacity: 0.5 }]}
          onPress={save}
          disabled={!canSave}
        >
          <Text style={s.bigBtnText}>
            {needsTier && name.trim()
              ? 'Choose a food type to save'
              : batch
              ? asRecipe
                ? 'Save recipe and log 1 serving'
                : 'Log 1 serving'
              : 'Save and log'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** A labelled field, with its error (if any) shown right under it. */
function FieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  suffix,
  suffixAlways,
  accessibilityLabel,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  suffix?: string;
  /** Show the unit even before anything is typed, so it's clear what to enter ("oz"). */
  suffixAlways?: boolean;
  accessibilityLabel?: string;
  error?: string | null;
}) {
  return (
    <View>
      <View style={s.row}>
        <Text style={s.rowLabel}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ink3}
          keyboardType={keyboardType}
          accessibilityLabel={accessibilityLabel ?? label}
          style={s.rowInput}
        />
        {suffix && (value || suffixAlways) ? (
          <Text style={s.rowSuffix}>{suffix}</Text>
        ) : null}
      </View>
      {error ? (
        <Text style={s.error} accessibilityLiveRegion='polite'>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  intro: { ...typography.meta, lineHeight: 18, marginTop: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 8,
  },
  // Wide enough for "Serving weighs" on one line.
  rowLabel: { ...typography.rowTitle, width: 112 },
  rowInput: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
    textAlign: 'right',
  },
  rowSuffix: { fontFamily: font.body, fontSize: 13, color: colors.ink2 },
  error: {
    ...typography.caption,
    color: colors.danger,
    // In line with the row's own inset (13), tucked up under it.
    paddingHorizontal: space.md + 1,
    paddingBottom: space.sm,
    marginTop: -space.xs,
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
