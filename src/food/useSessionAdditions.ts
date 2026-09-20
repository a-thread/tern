import { useMemo, useState } from 'react';

import { useFood } from './FoodContext';
import type { FoodEntry } from './models';
import { additionsSince } from './sessionAdditions';

/**
 * The foods added to today's log since this screen appeared. The Add food
 * screens stay open after adding, so they use this to confirm what went in
 * and to turn Cancel into Done.
 */
export function useSessionAdditions(): FoodEntry[] {
  const { foodLog } = useFood();
  const [baseline] = useState(() => new Set(foodLog.map((f) => f.id)));
  return useMemo(() => additionsSince(baseline, foodLog), [baseline, foodLog]);
}
