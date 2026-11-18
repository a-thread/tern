import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { WaypointsRepository } from './waypoints.repository';
import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useToast } from '@shared/state/ToastContext';
import { addDays, isTodayOrYesterday } from '@shared/utils/date';
import type { LedgerEvent, WaypointSource } from './models/waypoint';

export type { WaypointSource };

/** An award the UI hasn't celebrated yet. */
export type Celebration = {
  id: number;
  points: number;
  source: WaypointSource;
  /** Today or yesterday. */
  day: string;
};

type WaypointsContextValue = {
  /** Live waypoint total. Behavior-only — never adjusted for weight or calorie totals. */
  waypoints: number;
  /** False until the ledger has loaded. */
  ready: boolean;
  /** Reads the ledger again (pull to refresh). */
  reload: () => Promise<void>;
  /** The day the ledger is loaded for; awards are ignored until it matches today (briefly false after midnight). */
  day: string | null;
  /** Every award on record, kept current as awards are made and taken back. */
  events: LedgerEvent[];
  /** Award `points` for `source` on `day` (default today; only today or yesterday). Once per source per day. */
  addWaypoints: (points: number, source: WaypointSource, day?: string) => void;
  /** Quietly take back the award for `source` on `day` (default today). */
  revokeWaypoints: (
    points: number,
    source: WaypointSource,
    day?: string,
  ) => void;
  /** Awards waiting for the Today screen to play their animation, oldest first. */
  celebrations: Celebration[];
  /** Points in `celebrations` — the total the header chip should hold back until they land. */
  pendingPoints: number;
  /** Mark a celebration as played so the chip catches up. */
  completeCelebration: (id: number) => void;
};

const [WaypointsContext, useWaypoints] =
  createRequiredContext<WaypointsContextValue>(
    'useWaypoints',
    'WaypointsProvider',
  );
export { useWaypoints };

const awardKey = (day: string, source: WaypointSource) => `${day}:${source}`;

export function WaypointsProvider({
  repo: ledger,
  children,
}: {
  repo: WaypointsRepository;
  children: React.ReactNode;
}) {
  const toast = useToast();
  const [waypoints, setWaypoints] = useState(0);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [ledgerDay, setLedgerDay] = useState<string | null>(null);
  const ledgerDayRef = useRef<string | null>(null);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [ready, setReady] = useState(false);
  const day = useDayKey();
  // Today's and yesterday's awards, so award and revoke can decide synchronously.
  const awarded = useRef(new Set<string>());
  const nextId = useRef(1);

  // Bumped by each read, so a read that finishes after a newer one started is dropped.
  const readId = useRef(0);
  const reload = useCallback(async () => {
    const id = ++readId.current;
    try {
      const [snapshot, history] = await Promise.all([
        ledger.load(day),
        ledger.history(),
      ]);
      if (id !== readId.current) return;
      const yesterday = addDays(day, -1);
      awarded.current = new Set([
        ...snapshot.todaySources.map((s) => awardKey(day, s)),
        ...history
          .filter((e) => e.day === yesterday)
          .map((e) => awardKey(e.day, e.source)),
      ]);
      ledgerDayRef.current = day;
      setLedgerDay(day);
      setEvents(history);
      setWaypoints(snapshot.total);
    } catch (e) {
      console.warn('Could not load waypoints', e);
    } finally {
      if (id === readId.current) setReady(true);
    }
  }, [ledger, day]);

  useEffect(() => {
    const reads = readId;
    reload();
    return () => {
      reads.current++; // ignore a read still in flight
    };
  }, [reload]);

  const enqueue = useCallback(
    (points: number, source: WaypointSource, on: string) => {
      setCelebrations((prev) => [
        ...prev,
        { id: nextId.current++, points, source, day: on },
      ]);
    },
    [],
  );

  const award = useCallback(
    (points: number, source: WaypointSource, on: string = day) => {
      // Not until today's ledger has loaded, or a stale one would decide.
      if (ledgerDayRef.current !== day || !isTodayOrYesterday(on, day)) return;
      const key = awardKey(on, source);
      if (points <= 0 || awarded.current.has(key)) return;
      awarded.current.add(key);
      setWaypoints((w) => w + points);
      setEvents((prev) => [...prev, { source, day: on, points }]);
      enqueue(points, source, on);
      ledger.award(source, points, on).catch((e) => {
        console.warn('Could not save waypoints', e);
        toast.show("Couldn't save your waypoints — please try again.");
      });
    },
    [ledger, day, enqueue, toast],
  );

  /** Taking an award back is quiet, and cancels a celebration that hasn't played yet. */
  const revoke = useCallback(
    (points: number, source: WaypointSource, on: string = day) => {
      if (ledgerDayRef.current !== day || !isTodayOrYesterday(on, day)) return;
      if (!awarded.current.delete(awardKey(on, source))) return;
      setWaypoints((w) => Math.max(w - points, 0));
      setEvents((prev) =>
        prev.filter((e) => !(e.source === source && e.day === on)),
      );
      setCelebrations((prev) => {
        const i = prev
          .map((c) => awardKey(c.day, c.source))
          .lastIndexOf(awardKey(on, source));
        return i === -1 ? prev : prev.filter((_, idx) => idx !== i);
      });
      ledger.revoke(source, on).catch((e) => {
        console.warn('Could not save waypoints', e);
        toast.show("Couldn't save your waypoints — please try again.");
      });
    },
    [ledger, day, toast],
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
      ready,
      reload,
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
      reload,
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
