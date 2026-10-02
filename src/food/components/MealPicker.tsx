import React from 'react';
import { SegmentedControl } from '@shared/components/ui';
import type { FoodEntry } from '@food/models';

type Meal = FoodEntry['meal'];

/** Reassigns which meal a food entry counts toward. */
export function MealPicker({
  value,
  onChange,
  options,
}: {
  value: Meal;
  onChange: (meal: Meal) => void;
  options: { key: Meal; label: string }[];
}) {
  return (
    <SegmentedControl
      options={options.map((o) => o.key)}
      value={value}
      onChange={onChange}
      label={(key) => options.find((o) => o.key === key)?.label ?? key}
    />
  );
}
