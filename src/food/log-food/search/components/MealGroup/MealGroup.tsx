import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';

/** A labelled list of meals to pick from; `Row` draws each one (saved meals and past days' meals). */
export function MealGroup<T extends { id: string }>({
  label,
  meals,
  onPick,
  Row,
}: {
  label: string;
  meals: T[];
  onPick: (meal: T) => void;
  Row: React.ComponentType<{ meal: T; onPress: () => void }>;
}) {
  return (
    <>
      <GroupLabel>{label}</GroupLabel>
      <Group>
        {meals.map((m) => (
          <Row key={m.id} meal={m} onPress={() => onPick(m)} />
        ))}
      </Group>
    </>
  );
}
