import React, { useCallback, useMemo, useState } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { newId } from '@shared/utils/id';
import { addDays } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { useAward } from '@journey/hooks/useAward';
import { WaypointSource } from '@journey/models/waypoint';
import type { MovementRepository } from '@movement/data/movement.repository';
import type { WorkoutsSource } from '@movement/data/movement.healthconnect';
import {
  dayMinutes,
  goalMinutesByDay,
  isLoggableDay,
  isValidMinutes,
  MovementLimits,
  minutesByDay,
  type Activity,
  type Effort,
  type MovementEntry,
} from '@movement/models/movementEntry';

/** How far back movement is loaded: the same history the week rings and streak use. */
const HISTORY_DAYS = 180;

type MovementContextValue = {
  /** False until movement has loaded once. */
  ready: boolean;
  /** Reads everything again from storage (pull to refresh). */
  reload: () => Promise<unknown>;
  /** Movement tracking is switched on in Settings. */
  enabled: boolean;
  /** Everything loaded, manual and from Health Connect, oldest first. */
  entries: MovementEntry[];
  minutesByDay: Record<string, number>;
  todayMinutes: number;
  /** Minutes per day that count toward a goal day: everything but walks and runs, which steps already count. */
  goalMinutesByDay: Record<string, number>;
  todayGoalMinutes: number;
  /** Logs movement for `day` (today or yesterday). False if it can't be logged. */
  add: (input: {
    day: string;
    activity: Activity;
    minutes: number;
    effort: Effort | null;
    distanceM?: number | null;
  }) => boolean;
  /** Removes a manual entry; workouts from Health Connect can't be removed here. */
  remove: (id: string) => void;
  /** Entries from `from` to `to` inclusive, for Trends. */
  loadRange: (from: string, to: string) => Promise<MovementEntry[]>;
  /** Whether workouts can be read from Health Connect in this build. */
  workoutsAvailable: boolean;
  /** Asks for permission to read workouts, then reloads. Resolves to whether it was granted. */
  connectWorkouts: () => Promise<boolean>;
};

const [MovementContext, useMovement] = createRequiredContext<MovementContextValue>(
  'useMovement',
  'MovementProvider',
);
export { useMovement };

/**
 * Movement logged by hand plus workouts read from Health Connect (when allowed),
 * and the waypoint for logging any movement today. Activity reads `goalMinutesByDay`
 * to count movement toward goal days. Must sit inside SettingsProvider and
 * WaypointsProvider.
 */
export function MovementProvider({
  repo,
  workouts,
  children,
}: {
  repo: MovementRepository;
  /** Health Connect workouts; absent where Health Connect isn't available. */
  workouts?: WorkoutsSource | null;
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const today = useDayKey();
  const enabled = settings.trackMovement;
  const readWorkouts = enabled && settings.healthData.readWorkouts && !!workouts;

  const load = useCallback(
    async (from: string, to: string) => {
      const [manual, read] = await Promise.all([
        repo.load(from, to),
        readWorkouts && workouts ? workouts.getRange(from, to).catch(() => []) : Promise.resolve([]),
      ]);
      return [...manual, ...read].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
    },
    [repo, workouts, readWorkouts],
  );

  const [entries, setEntries] = useState<MovementEntry[]>([]);
  const { ready, reload } = useLoader(
    useCallback(() => load(addDays(today, -(HISTORY_DAYS - 1)), today), [load, today]),
    setEntries,
    'Could not load movement',
  );
  const persist = usePersist(reload);

  const byDay = useMemo(() => (enabled ? minutesByDay(entries) : {}), [entries, enabled]);
  const todayMinutes = enabled ? dayMinutes(entries, today) : 0;
  const goalByDay = useMemo(() => (enabled ? goalMinutesByDay(entries) : {}), [entries, enabled]);
  const todayGoalMinutes = goalByDay[today] ?? 0;

  // Logging any movement today earns its waypoint; removing it all takes it back.
  useAward(WaypointSource.Movement, todayMinutes > 0, enabled && ready);

  const add = useCallback<MovementContextValue['add']>(
    ({ day, activity, minutes, effort, distanceM = null }) => {
      if (!isLoggableDay(day, today) || !isValidMinutes(minutes)) return false;
      const entry: MovementEntry = {
        id: newId(),
        day,
        activity,
        minutes,
        effort,
        distanceM: distanceM && distanceM > 0 ? Math.min(Math.round(distanceM), MovementLimits.MAX_DISTANCE_M) : null,
        source: 'manual',
        loggedAt: new Date().toISOString(),
      };
      setEntries((prev) => [...prev, entry]);
      persist(repo.add(entry), {
        log: 'Could not save movement',
        toast: "Couldn't save that movement — please try again.",
      });
      return true;
    },
    [repo, today, persist],
  );

  const remove = useCallback(
    (id: string) => {
      const target = entries.find((e) => e.id === id);
      if (!target || target.source !== 'manual') return;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      persist(repo.remove(id), {
        log: 'Could not remove movement',
        toast: "Couldn't remove that — please try again.",
      });
    },
    [entries, repo, persist],
  );

  const connectWorkouts = useCallback(async () => {
    if (!workouts) return false;
    const ok = await workouts.connect(true);
    if (ok) await reload();
    return ok;
  }, [workouts, reload]);

  const value = useMemo<MovementContextValue>(
    () => ({
      ready,
      reload,
      enabled,
      entries: enabled ? entries : [],
      minutesByDay: byDay,
      todayMinutes,
      goalMinutesByDay: goalByDay,
      todayGoalMinutes,
      add,
      remove,
      loadRange: load,
      workoutsAvailable: !!workouts,
      connectWorkouts,
    }),
    [ready, reload, enabled, entries, byDay, todayMinutes, goalByDay, todayGoalMinutes, add, remove, load, workouts, connectWorkouts],
  );

  return <MovementContext.Provider value={value}>{children}</MovementContext.Provider>;
}
