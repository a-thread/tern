import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { MEAL_OPTIONS } from '../models';
import { useFood } from '../FoodContext';
import { useSavedMeals } from '../SavedMealsContext';
import { MealPicker } from '../components';
import { useFoodDisplay } from '../useFoodDisplay';
import { MAX_MEAL_NAME, itemsToEntries, scaleServings } from '../savedMeals';
import { scaledTotals, stepScale } from '../mealDraft';
import type { LogFoodStackParamList } from '../types';
import ItemRow from './ItemRow';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'SavedMeal'>;

/** A saved meal: what's in it, and one tap to add all of it to a meal. */
export default function SavedMealScreen({ navigation, route }: Props) {
  const { meal: initialMeal, mealId } = route.params;
  const insets = useSafeAreaInsets();
  const { addFoodEntries } = useFood();
  const { meals, renameMeal, deleteMeal, startDraft } = useSavedMeals();
  const { showCalories } = useFoodDisplay();
  const saved = meals.find((m) => m.id === mealId);

  const [target, setTarget] = useState(initialMeal);
  // Scales every food when adding (0.5 = half portions); the saved meal is unchanged.
  const [scale, setScale] = useState(1);
  const [name, setName] = useState(saved?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  // Follow the stored name when it changes from elsewhere (e.g. after a refresh).
  useEffect(() => {
    if (saved) setName(saved.name);
  }, [saved?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!saved) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
        <SheetNav title='Saved meal' leftLabel='Back' onLeftPress={() => navigation.goBack()} />
        <Text style={s.gone}>This meal is no longer saved.</Text>
      </View>
    );
  }

  const totals = scaledTotals(saved.items, scale);
  const targetLabel = MEAL_OPTIONS.find((m) => m.key === target)?.label ?? target;

  const saveName = () => {
    const error = renameMeal(saved.id, name);
    setNameError(error);
    if (error) setName(saved.name);
  };

  const add = () => {
    addFoodEntries(itemsToEntries(saved.items, target, scale));
    navigation.getParent()?.goBack();
  };

  const editMeal = () => {
    startDraft(saved.id);
    navigation.navigate('MealEditor');
  };

  const confirmDelete = () =>
    Alert.alert('Delete saved meal?', `“${saved.name}” will be removed. Foods already logged stay.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMeal(saved.id);
          navigation.goBack();
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <SheetNav
        title='Saved meal'
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
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameError(null);
            }}
            onBlur={saveName}
            onSubmitEditing={saveName}
            maxLength={MAX_MEAL_NAME}
            returnKeyType='done'
            accessibilityLabel='Meal name'
            style={s.name}
          />
          {nameError ? <Text style={s.error}>{nameError}</Text> : null}
          <Text style={s.sub}>
            {saved.items.length} {saved.items.length === 1 ? 'food' : 'foods'}
            {showCalories ? ` · ${Math.round(totals.calories)} cal` : ''}
            {` · ${Math.round(totals.protein)}g protein`}
          </Text>
        </View>

        <GroupLabel>In this meal</GroupLabel>
        <Group>
          {saved.items.map((item, i) => (
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
              {scale === 1 ? 'As saved' : `${scale}× as saved`}
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

        <Pressable onPress={editMeal} hitSlop={8} style={s.editBtn}>
          <Text style={s.editText}>Edit meal</Text>
        </Pressable>

        <Pressable onPress={confirmDelete} hitSlop={8} style={s.deleteBtn}>
          <Text style={s.deleteText}>Delete saved meal</Text>
        </Pressable>
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
    padding: 0,
  },
  error: { fontFamily: font.body, fontSize: 12.5, color: '#B3261E', marginTop: 4 },
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
  editBtn: { alignItems: 'center', paddingTop: space.lg },
  editText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink },
  deleteBtn: { alignItems: 'center', paddingVertical: space.lg },
  deleteText: { fontFamily: font.semibold, fontSize: 13.5, color: '#B3261E' },
  gone: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    textAlign: 'center',
    padding: space.xl,
  },
});
