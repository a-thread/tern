import React, { useCallback, useMemo } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useSyncedList } from '@shared/hooks/useSyncedList';
import { newId } from '@shared/utils/id';
import { addDays } from '@shared/utils/date';
import { useSettings } from '../settings/SettingsContext';
import { useAward } from '../waypoints/hooks/useAward';
import { WaypointSource } from '../waypoints/models/waypoint';
import type { MovementRepository } from './movement.repository';
import type { WorkoutsSource } from './movement.healthconnect';
import {
  dayMinutes,
  goalMinutesByDay,
  isLoggableDay,
  loggedAmount,
  MovementLimits,
  minutesByDay,
  movedOn,
  stepsByDay,
  type Activity,
  type Effort,
  type MovementEntry,
  MovementSource,
} from './models/movementEntry';

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
  /** Steps logged by hand per day, added to the health app's. */
  stepsByDay: Record<string, number>;
  /** Logs movement for `day` (today or yesterday). False if it can't be logged. */
  add: (input: {
    day: string;
    activity: Activity;
    minutes: number;
    effort: Effort | null;
    distanceM?: number | null;
    /** Instead of minutes, for an in-steps activity. */
    steps?: number | null;
  }) => boolean;
  /** Manual entries on an editable day only. */
  update: (
    id: string,
    input: {
      minutes: number;
      effort: Effort | null;
      distanceM?: number | null;
      steps?: number | null;
    },
  ) => boolean;
  /** Removes a manual entry; workouts from Health Connect can't be removed here. */
  remove: (id: string) => void;
  /** Entries from `from` to `to` inclusive, for Trends. */
  loadRange: (from: string, to: string) => Promise<MovementEntry[]>;
  /** Whether workouts can be read from Health Connect in this build. */
  workoutsAvailable: boolean;
  /** Asks for permission to read workouts, then reloads. Resolves to whether it was granted. */
  connectWorkouts: () => Promise<boolean>;
};

const [MovementContext, useMovement] =
  createRequiredContext<MovementContextValue>(
    'useMovement',
    'MovementProvider',
  );
export { useMovement };

/** Manual entries plus health-app workouts. Inside Settings and Waypoints. */
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
  const readWorkouts =
    enabled && settings.healthData.readWorkouts && !!workouts;

  const load = useCallback(
    async (from: string, to: string) => {
      const [manual, read] = await Promise.all([
        repo.load(from, to),
        readWorkouts && workouts
          ? workouts.getRange(from, to).catch(() => [])
          : Promise.resolve([]),
      ]);
      return [...manual, ...read].sort((a, b) =>
        a.loggedAt.localeCompare(b.loggedAt),
      );
    },
    [repo, workouts, readWorkouts],
  );

  const { entries, ready, reload, change } = useSyncedList(
    useCallback(
      () => load(addDays(today, -(HISTORY_DAYS - 1)), today),
      [load, today],
    ),
    'Could not load movement',
  );

  const byDay = useMemo(
    () => (enabled ? minutesByDay(entries) : {}),
    [entries, enabled],
  );
  const todayMinutes = enabled ? dayMinutes(entries, today) : 0;
  const goalByDay = useMemo(
    () => (enabled ? goalMinutesByDay(entries) : {}),
    [entries, enabled],
  );
  const todayGoalMinutes = goalByDay[today] ?? 0;
  const manualSteps = useMemo(
    () => (enabled ? stepsByDay(entries) : {}),
    [entries, enabled],
  );

  // Any movement today or yesterday earns that day's waypoint.
  const yesterday = addDays(today, -1);
  useAward(
    WaypointSource.Movement,
    enabled && movedOn(entries, today),
    enabled && ready,
  );
  useAward(
    WaypointSource.Movement,
    enabled && movedOn(entries, yesterday),
    enabled && ready,
    { day: yesterday },
  );

  const add = useCallback<MovementContextValue['add']>(
    ({ day, activity, minutes, effort, distanceM = null, steps = null }) => {
      const amount = loggedAmount(activity, minutes, steps);
      if (!isLoggableDay(day, today) || !amount) return false;
      const entry: MovementEntry = {
        id: newId(),
        day,
        activity,
        ...amount,
        effort,
        distanceM:
          distanceM && distanceM > 0
            ? Math.min(Math.round(distanceM), MovementLimits.MAX_DISTANCE_M)
            : null,
        source: MovementSource.Manual,
        loggedAt: new Date().toISOString(),
      };
      change((prev) => [...prev, entry], repo.add(entry), {
        log: 'Could not save movement',
        toast: "Couldn't save that movement — please try again.",
      });
      return true;
    },
    [repo, today, change],
  );

  const update = useCallback<MovementContextValue['update']>(
    (id, { minutes, effort, distanceM = null, steps = null }) => {
      const target = entries.find((e) => e.id === id);
      const amount = target && loggedAmount(target.activity, minutes, steps);
      if (
        !target ||
        !amount ||
        target.source !== MovementSource.Manual ||
        !isLoggableDay(target.day, today)
      ) {
        return false;
      }
      const changed: MovementEntry = {
        ...target,
        ...amount,
        effort,
        distanceM:
          distanceM && distanceM > 0
            ? Math.min(Math.round(distanceM), MovementLimits.MAX_DISTANCE_M)
            : null,
      };
      change(
        (prev) => prev.map((e) => (e.id === id ? changed : e)),
        repo.update(changed),
        {
          log: 'Could not update movement',
          toast: "Couldn't save that change — please try again.",
        },
      );
      return true;
    },
    [entries, repo, today, change],
  );

  const remove = useCallback(
    (id: string) => {
      const target = entries.find((e) => e.id === id);
      if (!target || target.source !== MovementSource.Manual) return;
      change((prev) => prev.filter((e) => e.id !== id), repo.remove(id), {
        log: 'Could not remove movement',
        toast: "Couldn't remove that — please try again.",
      });
    },
    [entries, repo, change],
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
      stepsByDay: manualSteps,
      add,
      update,
      remove,
      loadRange: load,
      workoutsAvailable: !!workouts,
      connectWorkouts,
    }),
    [
      ready,
      reload,
      enabled,
      entries,
      byDay,
      todayMinutes,
      goalByDay,
      todayGoalMinutes,
      manualSteps,
      add,
      update,
      remove,
      load,
      workouts,
      connectWorkouts,
    ],
  );

  return (
    <MovementContext.Provider value={value}>
      {children}
    </MovementContext.Provider>
  );
}
