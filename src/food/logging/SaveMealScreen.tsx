import React, { useState } from 'react';
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
import type { RootStackParamList } from '@shared/navigation/types';
import { useToast } from '@shared/state/ToastContext';
import { MEAL_OPTIONS } from '../models';
import { useFood } from '../FoodContext';
import { useSavedMeals } from '../SavedMealsContext';
import { MAX_MEAL_NAME, findMealByName, validateMealName } from '../savedMeals';
import { useFoodDisplay } from '../useFoodDisplay';
import ItemRow from './ItemRow';

type Props = NativeStackScreenProps<RootStackParamList, 'SaveMeal'>;

/** Names the foods in one of today's meals and saves them as a reusable meal. */
export default function SaveMealScreen({ navigation, route }: Props) {
  const { meal } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { foodLog } = useFood();
  const { meals, saveMeal } = useSavedMeals();
  const { showCalories } = useFoodDisplay();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const items = foodLog.filter((f) => f.meal === meal);
  const mealLabel = MEAL_OPTIONS.find((m) => m.key === meal)?.label ?? meal;
  const calories = Math.round(items.reduce((sum, f) => sum + f.calories * f.servings, 0));

  const submit = () => {
    const problem = validateMealName(name);
    if (problem) return setError(problem);

    const save = () => {
      const result = saveMeal(name, items);
      if (!result.ok) return setError(result.error);
      toast.show(
        result.replaced ? `Updated “${result.meal.name}”` : `Saved “${result.meal.name}”`,
      );
      navigation.goBack();
    };

    const existing = findMealByName(meals, name);
    if (existing) {
      Alert.alert(
        `Replace “${existing.name}”?`,
        'The saved meal will be updated with the foods shown here.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', onPress: save },
        ],
      );
    } else {
      save();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <SheetNav
        title='Save as meal'
        leftLabel='Cancel'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Save'
        onRightPress={items.length ? submit : undefined}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps='handled'
      >
        <GroupLabel>Name</GroupLabel>
        <View style={s.card}>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError(null);
            }}
            placeholder={`e.g. Usual ${mealLabel.toLowerCase()}`}
            placeholderTextColor={colors.ink3}
            maxLength={MAX_MEAL_NAME}
            autoFocus
            returnKeyType='done'
            onSubmitEditing={submit}
            accessibilityLabel='Meal name'
            style={s.input}
          />
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}

        <GroupLabel>
          {`${items.length} ${items.length === 1 ? 'food' : 'foods'} from ${mealLabel}${showCalories ? ` · ${calories} cal` : ''}`}
        </GroupLabel>
        {items.length ? (
          <Group>
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </Group>
        ) : (
          <Text style={s.empty}>Nothing is logged in {mealLabel.toLowerCase()} yet.</Text>
        )}
        <Text style={s.note}>
          The foods are saved with the portions you logged. Later changes to today's
          log won't change the saved meal.
        </Text>

        <Pressable
          style={[s.bigBtn, !items.length && { opacity: 0.45 }]}
          onPress={submit}
          disabled={!items.length}
        >
          <Text style={s.bigBtnText}>Save meal</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 13,
    paddingVertical: 4,
  },
  input: {
    fontFamily: font.medium,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 11,
  },
  error: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: '#B3261E',
    marginTop: 6,
    marginLeft: 4,
  },
  empty: { fontFamily: font.body, fontSize: 13, color: colors.ink2, padding: space.md },
  note: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    lineHeight: 17,
    marginTop: space.sm,
    marginHorizontal: 4,
  },
  bigBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: space.lg,
  },
  bigBtnText: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
});
