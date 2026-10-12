import React from 'react';

import { Group, GroupLabel } from '@/shared/components/ui/Layout';
import type { SearchResult } from '@/domain/food/sources/searchResult';
import type { FoodSource } from '@/domain/food/models/foodRanking';
import { FoodResultRow } from '@/food/log-food/search/components/FoodGroup/components/FoodResultRow/FoodResultRow';

/** A labelled list of foods to pick from. Foods that carry a source (`from`) show it as a tag. */
export function FoodGroup({
  label,
  foods,
  onPick,
}: {
  label: string;
  foods: (SearchResult & { from?: FoodSource })[];
  onPick: (r: SearchResult) => void;
}) {
  return (
    <>
      <GroupLabel>{label}</GroupLabel>
      <Group>
        {foods.map((r) => (
          <FoodResultRow key={r.id} result={r} from={r.from} onPress={() => onPick(r)} />
        ))}
      </Group>
    </>
  );
}
