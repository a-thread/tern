import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, space, typography } from '@shared/theme';
import { SheetNav } from '@shared/components/ui';
import { useSavedMeals } from '@food/SavedMealsContext';
import { SavedMealLimits } from '@food/models/savedMeals';
import type { LogFoodStackParamList } from '@food/navigation';
import { MealAdder, useMealAdder } from '@food/components/MealAdder';
import { confirm } from '@shared/utils/confirm';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'SavedMeal'>;

/** A saved meal: what's in it, and one tap to add all of it to a meal. */
export default function SavedMealScreen({ navigation, route }: Props) {
  const { meal: initialMeal, mealId } = route.params;
  const insets = useSafeAreaInsets();
  const { meals, renameMeal, deleteMeal, startDraft } = useSavedMeals();
  const saved = meals.find((m) => m.id === mealId);
  const items = saved?.items ?? [];
  const adder = useMealAdder(items, initialMeal, navigation);

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

  const saveName = () => {
    const error = renameMeal(saved.id, name);
    setNameError(error);
    if (error) setName(saved.name);
  };

  const editMeal = () => {
    startDraft(saved.id);
    navigation.navigate('MealEditor');
  };

  const confirmDelete = () =>
    confirm({
      title: 'Delete saved meal?',
      message: `“${saved.name}” will be removed. Foods already logged stay.`,
      action: 'Delete',
      onConfirm: () => {
        deleteMeal(saved.id);
        navigation.goBack();
      },
    });

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <SheetNav
        title='Saved meal'
        leftLabel='Back'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Add'
        onRightPress={adder.add}
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
            maxLength={SavedMealLimits.MAX_NAME_LENGTH}
            returnKeyType='done'
            accessibilityLabel='Meal name'
            style={s.name}
          />
          {nameError ? <Text style={s.error}>{nameError}</Text> : null}
          <Text style={s.sub}>{adder.summary}</Text>
        </View>

        <MealAdder items={items} adder={adder} itemsLabel='In this meal' scaleNoun='saved' />

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
  error: { fontFamily: font.body, fontSize: 12.5, color: colors.danger, marginTop: 4 },
  sub: { ...typography.meta, marginTop: 4 },
  editBtn: { alignItems: 'center', paddingTop: space.lg },
  editText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink },
  deleteBtn: { alignItems: 'center', paddingVertical: space.lg },
  deleteText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.danger },
  gone: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    textAlign: 'center',
    padding: space.xl,
  },
});
