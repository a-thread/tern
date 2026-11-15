import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space, typography } from '@shared/theme';
import { Group, GroupLabel, SheetNav, ToggleRow } from '@shared/components/ui';
import { TextField } from '../components/TextField/TextField';
import { MealServingsRow } from '../components/MealServingsRow/MealServingsRow';
import { RecipeServings } from '../components/RecipeServings/RecipeServings';
import { useReplaceWithShare } from './hooks/useReplaceWithShare';
import type { RootStackParamList } from '../../navigation/types';
import { useToast } from '@shared/state/ToastContext';
import { Meals } from '../../domain/food/models/meals';
import { formatCount } from '../../domain/food/models/servings';
import { useFood } from '../../domain/food/FoodContext';
import { useSavedMeals } from '../../domain/saved-meals/SavedMealsContext';
import {
  findMealByName,
  isRecipe,
  recipeClash,
  validateMealName,
  SavedMealLimits,
} from '../../domain/saved-meals/models/savedMeals';
import { useFoodDisplay } from '../../domain/food/hooks/useFoodDisplay';
import ItemRow from '../components/ItemRow/ItemRow';
import { confirm } from '@shared/utils/confirm';

type Props = NativeStackScreenProps<RootStackParamList, 'SaveMeal'>;

/**
 * Names the foods in one of today's meals and saves them as a reusable meal. Saved as making
 * several servings, it is a recipe: the whole pot's ingredients, logged later by the serving,
 * and today's log can swap the pot for the share that was eaten.
 */
export default function SaveMealScreen({ navigation, route }: Props) {
  const { meal } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { foodLog } = useFood();
  const { meals, saveMeal } = useSavedMeals();
  const { showCalories } = useFoodDisplay();
  const replaceWithShare = useReplaceWithShare();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState(SavedMealLimits.MIN_SERVINGS);
  const [logShare, setLogShare] = useState(true);
  const [eaten, setEaten] = useState(1);
  const recipe = isRecipe({ servings });

  const items = foodLog.filter((f) => f.meal === meal);
  const mealLabel = Meals.OPTIONS.find((m) => m.key === meal)?.label ?? meal;
  const calories = Math.round(
    items.reduce((sum, f) => sum + f.calories * f.servings, 0),
  );

  const submit = () => {
    const problem = validateMealName(name);
    if (problem) return setError(problem);

    const save = () => {
      const result = saveMeal(name, items, servings);
      if (!result.ok) return setError(result.error);
      const saved = result.replaced
        ? `Updated “${result.meal.name}”`
        : `Saved “${result.meal.name}”`;
      const undo =
        recipe && logShare
          ? replaceWithShare(items, result.meal, eaten)
          : null;
      const share = Math.min(eaten, servings);
      if (undo)
        toast.show(
          `${saved} · ${mealLabel} now shows ${formatCount(share)} ${share === 1 ? 'serving' : 'servings'}`,
          { label: 'Undo', onPress: undo },
        );
      else toast.show(recipe ? `${saved} · ${servings} servings` : saved);
      navigation.goBack();
    };

    const existing = findMealByName(meals, name);
    // A recipe is only replaced by another recipe, so say so before asking to replace it.
    if (existing && isRecipe(existing) && !recipe)
      return setError(recipeClash(existing.name));
    if (existing) {
      confirm({
        title: `Replace “${existing.name}”?`,
        message: recipe
          ? `The saved meal will be updated with the foods shown here, making ${servings} servings.`
          : 'The saved meal will be updated with the foods shown here.',
        action: 'Replace',
        destructive: false,
        onConfirm: save,
      });
    } else {
      save();
    }
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='Save as meal'
        leftLabel='Cancel'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Save'
        onRightPress={items.length ? submit : undefined}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps='handled'
      >
        <GroupLabel>Name</GroupLabel>
        <TextField
          value={name}
          onChangeText={(v) => {
            setName(v);
            setError(null);
          }}
          placeholder={`e.g. Usual ${mealLabel.toLowerCase()}`}
          maxLength={SavedMealLimits.MAX_NAME_LENGTH}
          autoFocus
          onSubmitEditing={submit}
          accessibilityLabel='Meal name'
          error={error}
        />

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
          <Text style={s.empty}>
            Nothing is logged in {mealLabel.toLowerCase()} yet.
          </Text>
        )}
        <Text style={s.note}>
          The foods are saved with the portions you logged. Later changes to
          this day's log won't change the saved meal.
        </Text>

        <GroupLabel>Batch size</GroupLabel>
        <MealServingsRow
          value={servings}
          onChange={setServings}
          title='Whole batch makes'
          sub={
            recipe
              ? 'Logged by the serving from now on'
              : 'Leave at 1 for a single meal'
          }
        />
        {recipe ? (
          <>
            <GroupLabel>{`Today's ${mealLabel.toLowerCase()}`}</GroupLabel>
            <Group>
              <ToggleRow
                title='Log only what I ate'
                sub={
                  logShare
                    ? 'Instead of the whole batch'
                    : 'The whole batch stays logged'
                }
                on={logShare}
                onToggle={setLogShare}
              />
            </Group>
            {logShare ? (
              <View style={s.share}>
                <RecipeServings
                  value={Math.min(eaten, servings)}
                  makes={servings}
                  onChange={setEaten}
                  title='I ate'
                  sub={`of the ${servings} servings`}
                />
              </View>
            ) : null}
          </>
        ) : null}

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
  empty: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink2,
    padding: space.md,
  },
  note: {
    ...typography.caption,
    lineHeight: 17,
    marginTop: space.sm,
    marginHorizontal: 4,
  },
  share: { marginTop: space.sm },
  bigBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: space.lg,
  },
  bigBtnText: { fontFamily: font.bold, fontSize: 15, color: colors.onAction },
});
