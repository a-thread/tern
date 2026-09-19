import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { allMealsLogged } from '@food/models';
import { useFood } from '@food/FoodContext';
import { INITIAL_WAYPOINTS } from './mock';
import { waypointRules } from './models';

const MEALS_BONUS_POINTS =
  waypointRules.find((r) => r.id === 'meals')?.points ?? 15;

type WaypointsContextValue = {
  /** Live waypoint total. Behavior-only — never adjusted for weight or calorie totals. */
  waypoints: number;
  addWaypoints: (points: number) => void;
};

const WaypointsContext = createContext<WaypointsContextValue | null>(null);

export function WaypointsProvider({ children }: { children: React.ReactNode }) {
  const { foodLog } = useFood();
  const [waypoints, setWaypoints] = useState<number>(INITIAL_WAYPOINTS);
  const mealsBonusAwarded = useRef(allMealsLogged(foodLog));

  /**
   * Keeps the "logging all meals" bonus honest: awards it the moment every
   * core meal has an entry, and takes it back if a removal or edit drops
   * coverage below that again — waypoints reflect the log as it stands now,
   * not just its high-water mark.
   */
  useEffect(() => {
    const complete = allMealsLogged(foodLog);
    if (complete && !mealsBonusAwarded.current) {
      mealsBonusAwarded.current = true;
      setWaypoints((w) => w + MEALS_BONUS_POINTS);
    } else if (!complete && mealsBonusAwarded.current) {
      mealsBonusAwarded.current = false;
      setWaypoints((w) => Math.max(w - MEALS_BONUS_POINTS, 0));
    }
  }, [foodLog]);

  const addWaypoints = useCallback((points: number) => {
    setWaypoints((w) => w + points);
  }, []);

  const value = useMemo<WaypointsContextValue>(
    () => ({ waypoints, addWaypoints }),
    [waypoints, addWaypoints],
  );

  return (
    <WaypointsContext.Provider value={value}>
      {children}
    </WaypointsContext.Provider>
  );
}

export function useWaypoints() {
  const ctx = useContext(WaypointsContext);
  if (!ctx)
    throw new Error('useWaypoints must be used within WaypointsProvider');
  return ctx;
}
