import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';
import type { SavedMeal } from '@food/models/savedMeals';
import { SavedMealRow } from './SavedMealRow';

/** A labelled list of saved meals to pick from. */
export function SavedMealGroup({
  label,
  meals,
  onPick,
}: {
  label: string;
  meals: SavedMeal[];
  onPick: (m: SavedMeal) => void;
}) {
  return (
    <>
      <GroupLabel>{label}</GroupLabel>
      <Group>
        {meals.map((m) => (
          <SavedMealRow key={m.id} meal={m} onPress={() => onPick(m)} />
        ))}
      </Group>
    </>
  );
}
