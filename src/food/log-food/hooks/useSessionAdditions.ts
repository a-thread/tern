import { useMemo, useState } from 'react';

import { useFood } from '@/domain/food/FoodContext';
import type { FoodEntry } from '@/domain/food/models/foodEntry';
import { additionsSince } from '../models/sessionAdditions';

/** Add food stays open, so this confirms what went in and turns Cancel into Done. */
export function useSessionAdditions(): FoodEntry[] {
  const { foodLog } = useFood();
  const [baseline] = useState(() => new Set(foodLog.map((f) => f.id)));
  return useMemo(() => additionsSince(baseline, foodLog), [baseline, foodLog]);
}
