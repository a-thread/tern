import React from 'react';

import { Group, GroupLabel } from '@shared/components/ui';
import type { SearchResult } from '@food/data/sources/searchResult';
import { FoodResultRow } from './FoodResultRow';

/** A labelled list of foods to pick from. */
export function FoodGroup({
  label,
  foods,
  onPick,
}: {
  label: string;
  foods: SearchResult[];
  onPick: (r: SearchResult) => void;
}) {
  return (
    <>
      <GroupLabel>{label}</GroupLabel>
      <Group>
        {foods.map((r) => (
          <FoodResultRow key={r.id} result={r} onPress={() => onPick(r)} />
        ))}
      </Group>
    </>
  );
}
