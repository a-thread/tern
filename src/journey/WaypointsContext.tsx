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
import { useBackend } from '@shared/state/BackendContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useToast } from '@shared/state/ToastContext';
import {
  waypointRules,
  type LedgerEvent,
  type WaypointSource,
} from './models';

export type { WaypointSource };

const MEALS_BONUS_POINTS =
  waypointRules.find((r) => r.id === 'meals')?.points ?? 15;

/** An award the UI hasn't celebrated yet. */
export type Celebration = {
  id: number;
  points: number;
  source: WaypointSource;
};

type WaypointsContextValue = {
  /** Live waypoint total. Behavior-only — never adjusted for weight or calorie totals. */
  waypoints: number;
  /** False until the ledger has loaded. */
  ready: boolean;
  /** The day the ledger is loaded for; awards are ignored until it matches today (briefly false after midnight). */
  day: string | null;
  /** Every award on record, kept current as awards are made and taken back. */
  events: LedgerEvent[];
  /** Award `points` for `source`. A source can only be awarded once per day, so repeats are ignored. */
  addWaypoints: (points: number, source: WaypointSource) => void;
  /** Quietly take back today's award for `source` (no-op if there isn't one). */
  revokeWaypoints: (points: number, source: WaypointSource) => void;
  /** Awards waiting for the Today screen to play their animation, oldest first. */
  celebrations: Celebration[];
  /** Points in `celebrations` — the total the header chip should hold back until they land. */
  pendingPoints: number;
  /** Mark a celebration as played so the chip catches up. */
  completeCelebration: (id: number) => void;
};

const WaypointsContext = createContext<WaypointsContextValue | null>(null);

export function WaypointsProvider({ children }: { children: React.ReactNode }) {
  const { waypoints: ledger } = useBackend();
  const {
    foodLog,
    skippedMeals,
    ready: foodReady,
    loadedDay: foodDay,
  } = useFood();
  const toast = useToast();
  const [waypoints, setWaypoints] = useState(0);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [ledgerDay, setLedgerDay] = useState<string | null>(null);
  const ledgerDayRef = useRef<string | null>(null);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [ready, setReady] = useState(false);
  const day = useDayKey();
  // Sources already awarded today — the ledger's one-per-day rule, mirrored
  // here so awarding and revoking decide synchronously.
  const awarded = useRef(new Set<WaypointSource>());
  const nextId = useRef(1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([ledger.load(day), ledger.history()])
      .then(([snapshot, history]) => {
        if (cancelled) return;
        awarded.current = new Set(snapshot.todaySources);
        ledgerDayRef.current = day;
        setLedgerDay(day);
        setEvents(history);
        setWaypoints(snapshot.total);
      })
      .catch((e) => console.warn('Could not load waypoints', e))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [ledger, day]);

  const enqueue = useCallback((points: number, source: WaypointSource) => {
    setCelebrations((prev) => [...prev, { id: nextId.current++, points, source }]);
  }, []);

  const award = useCallback(
    (points: number, source: WaypointSource) => {
      // Not until today's ledger has loaded, or a stale one would decide.
      if (ledgerDayRef.current !== day) return;
      if (points <= 0 || awarded.current.has(source)) return;
      awarded.current.add(source);
      setWaypoints((w) => w + points);
      setEvents((prev) => [...prev, { source, day, points }]);
      enqueue(points, source);
      ledger.award(source, points, day).catch((e) => {
        console.warn('Could not save waypoints', e);
        toast.show("Couldn't save your waypoints — they'll sync when you're back online.");
      });
    },
    [ledger, day, enqueue, toast],
  );

  /** Taking an award back is quiet, and cancels a celebration that hasn't played yet. */
  const revoke = useCallback(
    (points: number, source: WaypointSource) => {
      if (ledgerDayRef.current !== day) return;
      if (!awarded.current.delete(source)) return;
      setWaypoints((w) => Math.max(w - points, 0));
      setEvents((prev) =>
        prev.filter((e) => !(e.source === source && e.day === day)),
      );
      setCelebrations((prev) => {
        const i = prev.map((c) => c.source).lastIndexOf(source);
        return i === -1 ? prev : prev.filter((_, idx) => idx !== i);
      });
      ledger.revoke(source, day).catch((e) => {
        console.warn('Could not save waypoints', e);
        toast.show("Couldn't save your waypoints — they'll sync when you're back online.");
      });
    },
    [ledger, day, toast],
  );

  /**
   * Keeps the "logging all meals" bonus honest: awards it the moment every
   * core meal has an entry (or is marked "nothing today"), and takes it back if a removal or edit drops
   * coverage below that again — waypoints reflect the log as it stands now,
   * not just its high-water mark. Waits for both the food log and the ledger
   * to load, so an unloaded (empty) log is never mistaken for a dropped one.
   */
  useEffect(() => {
    // Both must be for today: right after midnight each still holds yesterday's data.
    if (!ready || !foodReady || ledgerDay !== day || foodDay !== day) return;
    if (allMealsLogged(foodLog, skippedMeals)) award(MEALS_BONUS_POINTS, 'meals');
    else revoke(MEALS_BONUS_POINTS, 'meals');
  }, [ready, foodReady, ledgerDay, foodDay, day, foodLog, skippedMeals, award, revoke]);

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
      ready,
      day: ledgerDay,
      events,
      addWaypoints: award,
      revokeWaypoints: revoke,
      celebrations,
      pendingPoints,
      completeCelebration,
    }),
    [
      waypoints,
      ready,
      ledgerDay,
      events,
      award,
      revoke,
      celebrations,
      pendingPoints,
      completeCelebration,
    ],
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
