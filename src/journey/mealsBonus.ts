import { useFood } from '@food/FoodContext';
import { CORE_MEALS, type FoodEntry } from '@food/models';
import { waypointRules } from './models';

export const MEALS_BONUS_POINTS =
  waypointRules.find((r) => r.id === 'meals')?.points ?? 15;

/**
 * Predicts whether logging `newMeal` next will complete the "log every
 * meal" set — for deciding whether to pop the Reward modal. The actual
 * point award/revoke lives centrally in WaypointsContext (reactive to
 * foodLog), so this never mutates state itself; call it BEFORE
 * addFoodEntry, since it reads the current (pre-add) foodLog.
 */
export function useWillCompleteAllMeals() {
  const { foodLog } = useFood();

  return (newMeal: FoodEntry['meal']): boolean => {
    const hadAllMeals = CORE_MEALS.every((m) =>
      foodLog.some((f) => f.meal === m),
    );
    if (hadAllMeals) return false;
    return CORE_MEALS.every(
      (m) => m === newMeal || foodLog.some((f) => f.meal === m),
    );
  };
}
