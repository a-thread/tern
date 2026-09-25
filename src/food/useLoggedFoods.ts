import { useEffect, useMemo, useState } from 'react';

import { useBackend } from '@shared/state/BackendContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { useFood } from './FoodContext';
import type { FoodEntry } from './models';
import { recentFoods } from './recentFoods';
import { recentMeals } from './recentMeals';

const RECENT_DAYS = 14;
const MINE_DAYS = 90;

/**
 * What you have logged yourself: `recent` foods (last two weeks), `mine` (last
 * three months) and `meals` — whole meals from the last two weeks, newest
 * first, ready to log again.
 */
export function useLoggedFoods() {
  const { food } = useBackend();
  const { foodLog } = useFood();
  const today = useDayKey();
  const [byDay, setByDay] = useState<Record<string, FoodEntry[]>>({});
  const [loaded, setLoaded] = useState(false);

  // foodLog is a trigger: reload after something is logged or removed.
  useEffect(() => {
    let cancelled = false;
    food
      .history(addDays(today, -(MINE_DAYS - 1)), today)
      .then((h) => !cancelled && setByDay(h))
      .catch((e) => console.warn('Could not load logged foods', e))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [food, today, foodLog]);

  return useMemo(
    () => ({
      loaded,
      recent: recentFoods(byDay, { fromDay: addDays(today, -(RECENT_DAYS - 1)) }),
      mine: recentFoods(byDay, { limit: 200 }),
      meals: recentMeals(byDay, {
        today,
        fromDay: addDays(today, -(RECENT_DAYS - 1)),
      }),
    }),
    [byDay, loaded, today],
  );
}
