import { usePullToRefresh } from '@shared/hooks/usePullToRefresh';
import { useActivity } from '../../domain/activity/ActivityContext';
import { useFood } from '../../domain/food/FoodContext';
import { useMedication } from '../../domain/medication/MedicationContext';
import { useMood } from '../../domain/mood/MoodContext';
import { useMovement } from '../../domain/movement/MovementContext';
import { useWater } from '../../domain/water/WaterContext';
import { useWaypoints } from '../../domain/waypoints/WaypointsContext';
import { useWeight } from '../../domain/weight/WeightContext';

/** Pull to refresh for everything Today shows: steps, the day's logs and the waypoint total. */
export function useTodayRefresh() {
  const { refresh: refreshSteps } = useActivity();
  const { reload: reloadFood } = useFood();
  const { reload: reloadWeight } = useWeight();
  const { reload: reloadWater } = useWater();
  const { reload: reloadMood } = useMood();
  const { reload: reloadMedication } = useMedication();
  const { reload: reloadMovement } = useMovement();
  const { reload: reloadWaypoints } = useWaypoints();
  return usePullToRefresh([
    refreshSteps,
    reloadFood,
    reloadWeight,
    reloadWater,
    reloadMood,
    reloadMedication,
    reloadMovement,
    reloadWaypoints,
  ]);
}
