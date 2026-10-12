import { useState } from 'react';

import { usePullToRefresh } from '../../shared/hooks/usePullToRefresh';
import { useActivity } from '../../domain/activity/ActivityContext';
import { useFood } from '../../domain/food/FoodContext';
import { useMood } from '../../domain/mood/MoodContext';
import { useMovement } from '../../domain/movement/MovementContext';
import { useWater } from '../../domain/water/WaterContext';
import { useWeight } from '../../domain/weight/WeightContext';

/**
 * Pull to refresh for Trends. `refreshKey` goes up after each pull, so the history each card
 * read for the range is read again too.
 */
export function useTrendsRefresh() {
  const { refresh: refreshSteps } = useActivity();
  const { reload: reloadFood } = useFood();
  const { reload: reloadWeight } = useWeight();
  const { reload: reloadWater } = useWater();
  const { reload: reloadMood } = useMood();
  const { reload: reloadMovement } = useMovement();
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshControl = usePullToRefresh([
    async () => {
      await Promise.allSettled([
        refreshSteps(),
        reloadFood(),
        reloadWeight(),
        reloadWater(),
        reloadMood(),
        reloadMovement(),
      ]);
      setRefreshKey((k) => k + 1);
    },
  ]);
  return { refreshControl, refreshKey };
}
