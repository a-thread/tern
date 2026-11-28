import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { space, typography } from '@shared/theme';
import { Card, FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useSavedMeals } from '@/domain/saved-meals/SavedMealsContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import {
  dishFromSavedMeal,
  routeOf,
  TernaryRules,
} from '@/domain/ternary/models/ternary';
import { promptFor, restingAt } from '@/domain/ternary/models/stopover';
import { useTernaryNavigation } from '@/navigation/useAppNavigation';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import {
  ButtonTone,
  TernaryButton,
} from '../components/TernaryButton/TernaryButton';

/**
 * The recipe swap: meals shared at the stop the shared bird rests at, with that stop's idea,
 * and the ones you've kept. Up to `MAX_MEALS_PER_STOP` each per stop; names and foods only.
 * Friends' recipes are hidden entirely when the person has turned that safeguard on.
 */
export default function RecipeSwapScreen() {
  const { ternary, bringDish } = useTernary();
  const { meals } = useSavedMeals();
  const { settings } = useSettings();
  const toast = useToast();
  const navigation = useTernaryNavigation();
  const [choosing, setChoosing] = useState(false);
  if (!ternary) return <TernaryPage title='Recipe swap'>{null}</TernaryPage>;

  const stop = restingAt(ternary.total, routeOf(ternary));
  const hideFriends = settings.hideFriendsFood;
  const shown = ternary.dishes.filter((d) => d.yours || !hideFriends);
  const now = stop ? shown.filter((d) => d.stop === stop.id) : [];
  const earlier = shown.filter((d) => !stop || d.stop !== stop.id);
  const yoursHere = now.filter((d) => d.yours);
  const canShare = yoursHere.length < TernaryRules.MAX_MEALS_PER_STOP;
  const sharable = meals.filter(
    (m) => !yoursHere.some((d) => d.name === m.name),
  );
  // Kept recipes are friends' too, so the safeguard hides them with the rest.
  const kept = hideFriends ? [] : settings.keptRecipes;

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
  const dishRow = (d: (typeof shown)[number]) => (
    <Row
      key={d.id}
      title={d.name}
      sub={`${d.yours ? 'You' : d.fromName} · ${d.foods.join(', ')}`}
      subLines={1}
      chevron
      onPress={() => open(d.id)}
    />
  );

  return (
    <TernaryPage title='Recipe swap'>
      {stop ? (
        <Card style={s.idea}>
          <Text style={typography.label}>{stop.name}</Text>
          <Text style={s.prompt}>{promptFor(stop.id)}</Text>
        </Card>
      ) : (
        <FootNote>Opens at your shared bird’s first stop.</FootNote>
      )}

      {stop && now.length ? (
        <>
          <GroupLabel>Shared here</GroupLabel>
          <Group>{now.map(dishRow)}</Group>
        </>
      ) : null}

      {stop && choosing ? (
        <>
          <GroupLabel>Your saved meals</GroupLabel>
          <Group>
            {sharable.length ? (
              sharable.map((m) => (
                <Row
                  key={m.id}
                  title={m.name}
                  chevron
                  onPress={() => share(m.id)}
                />
              ))
            ) : (
              <Row
                title={meals.length ? 'All shared here' : 'No saved meals yet'}
                sub={meals.length ? undefined : 'Save one in Food first'}
              />
            )}
          </Group>
          <TernaryButton
            label='Cancel'
            outline
            tone={ButtonTone.Aurora}
            onPress={() => setChoosing(false)}
          />
        </>
      ) : null}

      {stop && !choosing && canShare ? (
        <TernaryButton
          label='Share a meal'
          tone={ButtonTone.Aurora}
          onPress={() => setChoosing(true)}
        />
      ) : null}

      {kept.length ? (
        <>
          <GroupLabel>Kept to cook</GroupLabel>
          <Group>
            {kept.map((k) => (
              <Row
                key={k.id}
                title={k.name}
                sub={`${k.fromName} · ${k.foods.join(', ')}`}
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
          <GroupLabel>Earlier stops</GroupLabel>
          <Group>{earlier.map(dishRow)}</Group>
        </>
      ) : null}

      {hideFriends ? <FootNote>Friends’ recipes are hidden.</FootNote> : null}
    </TernaryPage>
  );
}

const s = StyleSheet.create({
  idea: { marginTop: space.md },
  prompt: { ...typography.heading, fontSize: 18, marginTop: space.xs },
});
