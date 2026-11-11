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
import type { TernaryStackParamList } from '../../navigation';
import { TernaryPage } from '../../components/TernaryPage/TernaryPage';
import { TernaryButton } from '../../components/TernaryButton/TernaryButton';

type Props = NativeStackScreenProps<TernaryStackParamList, 'Recipe'>;

/**
 * One recipe from the swap: who shared it, its foods, and keeping it to cook yourself. Only
 * names and foods, never amounts or numbers: whoever cooks it logs it their own way. A
 * friend's recipe can be reported; nobody is told.
 */
export default function RecipeScreen({ route }: Props) {
  const { ternary, report } = useTernary();
  const { settings, updateSettings } = useSettings();
  const toast = useToast();
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

  const toggleKeep = () => {
    if (kept) {
      updateSettings({ keptRecipes: unkeepRecipe(settings.keptRecipes, id) });
      return;
    }
    if (!dish) return;
    updateSettings({ keptRecipes: keepRecipe(settings.keptRecipes, dish) });
    toast.show('Kept. It’s under Kept to cook.');
  };

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

      <GroupLabel>What’s in it</GroupLabel>
      <Group>
        {recipe.foods.map((food) => (
          <Row key={food} title={food} />
        ))}
      </Group>
      <FootNote>
        No amounts or numbers come with a shared recipe. When you cook it, log the
        foods from the Food tab with your own amounts, and your display settings
        apply as always.
      </FootNote>

      {yours ? null : (
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
  name: { ...typography.screenTitle, marginTop: space.xs, marginBottom: space.sm },
});
