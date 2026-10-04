import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';
import type { RecentMeal } from '@food/models/recentMeals';
import { RecentMealRow } from './RecentMealRow';

/** A labelled list of meals from past days to log again. */
export function RecentMealGroup({
  label,
  meals,
  onPick,
}: {
  label: string;
  meals: RecentMeal[];
  onPick: (m: RecentMeal) => void;
}) {
  return (
    <>
      <GroupLabel>{label}</GroupLabel>
      <Group>
        {meals.map((m) => (
          <RecentMealRow key={m.id} meal={m} onPress={() => onPick(m)} />
        ))}
      </Group>
    </>
  );
}
