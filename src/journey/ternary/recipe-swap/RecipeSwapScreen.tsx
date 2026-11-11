import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { space, typography } from '@shared/theme';
import { Card, FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useSavedMeals } from '@/domain/saved-meals/SavedMealsContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { dishFromSavedMeal } from '@/domain/ternary/models/ternary';
import { promptFor, restingAt } from '@/domain/ternary/models/stopover';
import { useTernaryNavigation } from '@/navigation/useAppNavigation';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';

/**
 * The recipe swap: share a meal you love, and keep the ones friends share to cook yourself.
 * Each time the shared bird reaches a stop there's a new idea for what to share, and each
 * friend can share one meal per stop. Only names and foods are shared, never amounts or
 * numbers, and nobody is shown as not having shared one. Friends' recipes are hidden
 * entirely when the person has turned that safeguard on; their own and kept ones stay.
 */
export default function RecipeSwapScreen() {
  const { ternary, bringDish } = useTernary();
  const { meals } = useSavedMeals();
  const { settings } = useSettings();
  const toast = useToast();
  const navigation = useTernaryNavigation();
  const [choosing, setChoosing] = useState(false);
  if (!ternary) return <TernaryPage title='Recipe swap'>{null}</TernaryPage>;

  const stop = restingAt(ternary.total);
  const hideFriends = settings.hideFriendsFood;
  const shown = ternary.dishes.filter((d) => d.yours || !hideFriends);
  const now = stop ? shown.filter((d) => d.stop === stop.id) : [];
  const earlier = shown.filter((d) => !stop || d.stop !== stop.id);
  const yours = now.find((d) => d.yours);
  const kept = settings.keptRecipes;

  const share = async (mealId: string) => {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal || !stop) return;
    try {
      await bringDish(stop.id, dishFromSavedMeal(meal));
      setChoosing(false);
      toast.show(`You shared ${meal.name}.`);
    } catch (e) {
      console.warn('Could not share a recipe', e);
      toast.show('Couldn’t share that just now. Please try again.');
    }
  };

  const open = (id: string) => navigation.navigate('Recipe', { id });
  const by = (d: { yours: boolean; fromName: string }) => (d.yours ? 'You' : d.fromName);

  return (
    <TernaryPage title='Recipe swap'>
      <Text style={s.lead}>
        Share a meal you love, and keep the ones your friends share to cook
        yourself. Only the name and foods are shared, never amounts or numbers.
      </Text>

      {stop ? (
        <Card>
          <Text style={typography.label}>{`Idea for this stop · ${stop.name}`}</Text>
          <Text style={s.prompt}>{promptFor(stop.id)}</Text>
          <Text style={s.small}>
            A new idea each time your shared bird reaches a stop. One meal each, if
            you’d like.
          </Text>
        </Card>
      ) : (
        <FootNote>
          The swap opens when your shared bird reaches its first stop.
        </FootNote>
      )}

      {stop ? (
        <>
          <GroupLabel>Shared at this stop</GroupLabel>
          <Group>
            {now.map((d) => (
              <Row
                key={d.id}
                title={d.name}
                sub={`${by(d)} · ${d.foods.join(', ')}`}
                subLines={1}
                chevron
                onPress={() => open(d.id)}
              />
            ))}
            {choosing ? (
              meals.length ? (
                meals.map((m) => (
                  <Row key={m.id} title={m.name} sub='Share this one' chevron onPress={() => share(m.id)} />
                ))
              ) : (
                <Row
                  title='No saved meals yet'
                  sub='Save a meal from the Food tab, then share it here'
                />
              )
            ) : (
              <Row
                title={yours ? 'Share a different meal' : 'Share one of your saved meals'}
                sub={yours ? `Instead of ${yours.name}` : 'Your friends can keep it to cook'}
                chevron
                onPress={() => setChoosing(true)}
              />
            )}
          </Group>
        </>
      ) : null}

      {kept.length ? (
        <>
          <GroupLabel>Kept to cook</GroupLabel>
          <Group>
            {kept.map((k) => (
              <Row
                key={k.id}
                title={k.name}
                sub={`From ${k.fromName} · ${k.foods.join(', ')}`}
                subLines={1}
                chevron
                onPress={() => open(k.id)}
              />
            ))}
          </Group>
        </>
      ) : null}

      {earlier.length ? (
        <>
          <GroupLabel>Shared at earlier stops</GroupLabel>
          <Group>
            {earlier.map((d) => (
              <Row
                key={d.id}
                title={d.name}
                sub={`${by(d)} · ${d.foods.join(', ')}`}
                subLines={1}
                chevron
                onPress={() => open(d.id)}
              />
            ))}
          </Group>
        </>
      ) : null}

      {hideFriends ? (
        <FootNote>
          Friends’ recipes are hidden (Food display › Hide friends’ food).
        </FootNote>
      ) : null}
    </TernaryPage>
  );
}

const s = StyleSheet.create({
  lead: { ...typography.meta, lineHeight: 19, marginVertical: space.md },
  prompt: { ...typography.heading, fontSize: 18, marginTop: space.xs },
  small: { ...typography.caption, lineHeight: 16, marginTop: space.xs },
});
