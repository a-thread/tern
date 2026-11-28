import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { space, typography } from '@shared/theme';
import { FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { confirm } from '@shared/utils/confirm';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import {
  isKept,
  keepRecipe,
  unkeepRecipe,
} from '@/domain/ternary/models/recipeSwap';
import { stopNamed } from '@/domain/ternary/models/stopover';
import { ReportKind } from '@/domain/ternary/models/ternary';
import { useTernaryNavigation } from '@/navigation/useAppNavigation';
import type { TernaryStackParamList } from '../../navigation';
import { TernaryPage } from '../../components/TernaryPage/TernaryPage';
import {
  ButtonTone,
  TernaryButton,
} from '../../components/TernaryButton/TernaryButton';
import { useSavedMeals } from '@/domain/saved-meals/SavedMealsContext';
import { servingsText } from '@/domain/food/models/servings';

type Props = NativeStackScreenProps<TernaryStackParamList, 'Recipe'>;

/**
 * One recipe from the swap: who shared it, its foods with their amounts, and saving it to your
 * own meals, ready to log. Its nutrition is never shown here; once saved it's yours, shown
 * your way. A friend's recipe can be reported; nobody is told.
 */
export default function RecipeScreen({ route }: Props) {
  const { ternary, report, removeDish } = useTernary();
  const { saveSharedMeal } = useSavedMeals();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
  const navigation = useTernaryNavigation();
  const { id } = route.params;

  const dish = ternary?.dishes.find((d) => d.id === id);
  const keptOne = settings.keptRecipes.find((k) => k.id === id);
  const recipe = dish ?? keptOne;
  if (!recipe) {
    return (
      <TernaryPage title='Recipe'>
        <FootNote>This recipe isn’t shared any more.</FootNote>
      </TernaryPage>
    );
  }

  const yours = Boolean(dish?.yours);
  const kept = isKept(settings.keptRecipes, id);
  const from = yours ? 'You' : recipe.fromName;
  const where = dish ? stopNamed(dish.stop)?.name : undefined;

  // A recipe with amounts saves straight to your meals, ready to log; older shares only list foods.
  const items = dish?.items;
  const saveToMeals = () => {
    if (!dish || !items) return;
    const outcome = saveSharedMeal(dish.name, items, dish.servings ?? 1);
    if (!outcome.ok) {
      toast.show(outcome.error);
      return;
    }
    updateSettings({ keptRecipes: keepRecipe(settings.keptRecipes, dish) });
    toast.show('Saved to your meals. Log it from Food.');
  };

  const toggleKeep = () => {
    if (kept) {
      updateSettings({ keptRecipes: unkeepRecipe(settings.keptRecipes, id) });
      return;
    }
    if (!dish) return;
    updateSettings({ keptRecipes: keepRecipe(settings.keptRecipes, dish) });
    toast.show('Kept. It’s under Kept to cook.');
  };

  const askRemove = () =>
    confirm({
      title: 'Stop sharing this meal?',
      message: `Friends won’t see “${recipe.name}” any more. Anyone who kept it still has it.`,
      action: 'Stop sharing',
      onConfirm: async () => {
        try {
          await removeDish(id);
          navigation.goBack();
        } catch (e) {
          console.warn('Could not stop sharing a recipe', e);
          toast.show('Couldn’t do that just now. Please try again.');
        }
      },
    });

  const askReport = () =>
    confirm({
      title: 'Report this recipe?',
      message: `“${recipe.name}” will be sent to Tern to look at. ${recipe.fromName} isn’t told.`,
      action: 'Report',
      onConfirm: async () => {
        try {
          await report(ReportKind.Dish, id);
          toast.show('Thanks. It’s been reported.');
        } catch (e) {
          console.warn('Could not report a recipe', e);
          toast.show('Couldn’t report that just now. Please try again.');
        }
      },
    });

  return (
    <TernaryPage title='Recipe'>
      <Text style={s.from}>
        {where ? `Shared by ${from} at ${where}` : `Shared by ${from}`}
      </Text>
      <Text style={s.name}>{recipe.name}</Text>

      <GroupLabel>
        {items && (dish?.servings ?? 1) > 1
          ? `What’s in it · makes ${dish?.servings}`
          : 'What’s in it'}
      </GroupLabel>
      <Group>
        {items
          ? items.map((item, i) => (
              <Row
                key={`${item.name}-${i}`}
                title={item.name}
                value={servingsText(item.servings, item.servingLabel)}
              />
            ))
          : recipe.foods.map((food) => <Row key={food} title={food} />)}
      </Group>

      {yours ? (
        <TernaryButton label='Stop sharing' outline onPress={askRemove} />
      ) : items ? (
        <TernaryButton
          label={kept ? 'Saved to your meals' : 'Save to my meals'}
          tone={ButtonTone.Aurora}
          outline={kept}
          disabled={kept}
          onPress={saveToMeals}
        />
      ) : (
        <TernaryButton
          label={kept ? 'Kept to cook · remove' : 'Keep this recipe'}
          outline={kept}
          onPress={toggleKeep}
        />
      )}

      {!yours && dish ? (
        <Group>
          <Row title='Report this recipe' onPress={askReport} />
        </Group>
      ) : null}
    </TernaryPage>
  );
}

const s = StyleSheet.create({
  from: { ...typography.label, marginTop: space.md },
  name: {
    ...typography.screenTitle,
    marginTop: space.xs,
    marginBottom: space.sm,
  },
});
