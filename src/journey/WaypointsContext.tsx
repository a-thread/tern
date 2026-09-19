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

/** Which waypoint rule an award came from (matches `waypointRules` ids). */
export type WaypointSource = 'steps' | 'meals' | 'rest';

/** An award the UI hasn't celebrated yet. */
export type Celebration = {
  id: number;
  points: number;
  source: WaypointSource;
};

type WaypointsContextValue = {
  /** Live waypoint total. Behavior-only — never adjusted for weight or calorie totals. */
  waypoints: number;
  addWaypoints: (points: number, source: WaypointSource) => void;
  /** Awards waiting for the Today screen to play their animation, oldest first. */
  celebrations: Celebration[];
  /** Points in `celebrations` — the total the header chip should hold back until they land. */
  pendingPoints: number;
  /** Mark a celebration as played so the chip catches up. */
  completeCelebration: (id: number) => void;
};

const WaypointsContext = createContext<WaypointsContextValue | null>(null);

export function WaypointsProvider({ children }: { children: React.ReactNode }) {
  const { foodLog } = useFood();
  const [waypoints, setWaypoints] = useState<number>(INITIAL_WAYPOINTS);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const mealsBonusAwarded = useRef(allMealsLogged(foodLog));
  const nextId = useRef(1);

  const enqueue = useCallback((points: number, source: WaypointSource) => {
    setCelebrations((prev) => [...prev, { id: nextId.current++, points, source }]);
  }, []);

  /**
   * Keeps the "logging all meals" bonus honest: awards it the moment every
   * core meal has an entry, and takes it back if a removal or edit drops
   * coverage below that again — waypoints reflect the log as it stands now,
   * not just its high-water mark. Awards are celebrated; take-backs are
   * applied quietly (and cancel a celebration that hasn't played yet).
   */
  useEffect(() => {
    const complete = allMealsLogged(foodLog);
    if (complete && !mealsBonusAwarded.current) {
      mealsBonusAwarded.current = true;
      setWaypoints((w) => w + MEALS_BONUS_POINTS);
      enqueue(MEALS_BONUS_POINTS, 'meals');
    } else if (!complete && mealsBonusAwarded.current) {
      mealsBonusAwarded.current = false;
      setWaypoints((w) => Math.max(w - MEALS_BONUS_POINTS, 0));
      setCelebrations((prev) => {
        const i = prev.map((c) => c.source).lastIndexOf('meals');
        return i === -1 ? prev : prev.filter((_, idx) => idx !== i);
      });
    }
  }, [foodLog, enqueue]);

  const addWaypoints = useCallback(
    (points: number, source: WaypointSource) => {
      setWaypoints((w) => w + points);
      if (points > 0) enqueue(points, source);
    },
    [enqueue],
  );

  const completeCelebration = useCallback((id: number) => {
    setCelebrations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const pendingPoints = useMemo(
    () => celebrations.reduce((sum, c) => sum + c.points, 0),
    [celebrations],
  );

  const value = useMemo<WaypointsContextValue>(
    () => ({
      waypoints,
      addWaypoints,
      celebrations,
      pendingPoints,
      completeCelebration,
    }),
    [waypoints, addWaypoints, celebrations, pendingPoints, completeCelebration],
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
