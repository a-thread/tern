import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { space, typography } from '@shared/theme';
import { FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { confirm } from '@shared/utils/confirm';
import { useSavedMeals } from '@/domain/saved-meals/SavedMealsContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import {
  dishFromSavedMeal,
  type Dish,
} from '@/domain/ternary/models/ternary';
import {
  promptFor,
  restingAt,
  stopNamed,
} from '@/domain/ternary/models/stopover';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';

/**
 * The stopover table: while the shared bird rests at a stop, each friend may bring one dish
 * from their saved meals, foods only. Nobody is shown as not having brought one, there's no
 * countdown, and past tables stay as the ternary's recipe box. Friends' food is hidden
 * entirely when the person has turned that safeguard on.
 */
export default function StopoverTableScreen() {
  const { ternary, bringDish, report } = useTernary();
  const { meals } = useSavedMeals();
  const { settings } = useSettings();
  const toast = useToast();
  const [choosing, setChoosing] = useState(false);
  if (!ternary) return <TernaryPage title='Stopover table'>{null}</TernaryPage>;

  const stop = restingAt(ternary.total);
  if (!stop) {
    return (
      <TernaryPage title='Stopover table'>
        <FootNote>
          The first table opens when your shared bird reaches its first stop.
        </FootNote>
      </TernaryPage>
    );
  }

  const hideFriends = settings.hideFriendsFood;
  const atTable = ternary.dishes.filter(
    (d) => d.stop === stop.id && (d.yours || !hideFriends),
  );
  const yours = atTable.find((d) => d.yours);
  const past = hideFriends
    ? []
    : ternary.dishes.filter((d) => d.stop !== stop.id);

  const bring = async (mealId: string) => {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;
    try {
      await bringDish(stop.id, dishFromSavedMeal(meal));
      setChoosing(false);
      toast.show(`You brought ${meal.name}.`);
    } catch (e) {
      console.warn('Could not bring a dish', e);
      toast.show('Couldn’t bring that just now. Please try again.');
    }
  };

  const askReport = (dish: Dish) =>
    confirm({
      title: 'Report this dish?',
      message: `“${dish.name}” will be sent to Tern to look at. ${dish.fromName} isn’t told.`,
      action: 'Report',
      onConfirm: async () => {
        await report('dish', dish.id).catch(() => {});
        toast.show('Thanks. It’s been reported.');
      },
    });

  return (
    <TernaryPage title='Stopover table'>
      <Text style={s.eyebrow}>{`Stopover table · ${stop.name}`}</Text>
      <Text style={s.prompt}>{promptFor(stop.id)}</Text>
      <Text style={s.lead}>
        Terns feed up together at a stopover. This table is open while your shared
        bird rests here.
      </Text>

      {atTable.length ? (
        <Group>
          {atTable.map((d) => (
            <Row
              key={d.id}
              title={d.name}
              sub={`${d.yours ? 'You' : d.fromName} · ${d.foods.join(', ')}`}
              onPress={d.yours ? undefined : () => askReport(d)}
            />
          ))}
        </Group>
      ) : null}

      <GroupLabel>{yours ? 'Swap your dish' : 'Bring a dish'}</GroupLabel>
      {choosing ? (
        <Group>
          {meals.length ? (
            meals.map((m) => (
              <Row key={m.id} title={m.name} chevron onPress={() => bring(m.id)} />
            ))
          ) : (
            <Row
              title='No saved meals yet'
              sub='Save a meal from the Food tab, then bring it here'
            />
          )}
        </Group>
      ) : (
        <Group>
          <Row
            title='Choose from your saved meals'
            sub='One dish each, if you’d like'
            chevron
            onPress={() => setChoosing(true)}
          />
        </Group>
      )}
      <FootNote>
        Only the foods are shared, never amounts or numbers. Nobody is shown as not
        having brought one. Tap a friend’s dish to report it.
      </FootNote>

      {past.length ? (
        <>
          <GroupLabel>Stopover recipes</GroupLabel>
          <Group>
            {past.map((d) => (
              <Row
                key={d.id}
                title={d.name}
                sub={`${d.yours ? 'You' : d.fromName} · ${stopNamed(d.stop)?.name ?? 'A stop'} · ${d.foods.join(', ')}`}
              />
            ))}
          </Group>
        </>
      ) : null}
    </TernaryPage>
  );
}

const s = StyleSheet.create({
  eyebrow: { ...typography.label, marginTop: space.md },
  prompt: { ...typography.screenTitle, marginTop: space.xs },
  lead: { ...typography.meta, lineHeight: 19, marginTop: space.xs, marginBottom: space.md },
});
