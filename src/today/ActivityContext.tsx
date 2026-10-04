import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { addDays } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { useAward } from '@journey/hooks/useAward';
import { buildDays, computeStreak, restDaysLeft, weekOf, type DayRecord } from '@today/models/dayRecord';
import { goalFor } from '@today/models/stepGoal';
import { StepsRepository, StepsStatus } from '@today/data/steps.repository';
import type { RestDaysRepository } from '@today/data/restDays.repository';
import { sameDays, sameSteps } from '@today/utils/sameData';
import { WaypointSource } from '@journey/models/waypoint';

/** How much history is read: enough for the 6-month views. */
export const HISTORY_DAYS = 180;
const REFRESH_MS = 5 * 60 * 1000;
const REST_FAILURE = {
  log: 'Could not save rest day',
  toast: "Couldn't save that rest day — please try again.",
};

type ActivityContextValue = {
  /** False until steps and rest days have loaded once. */
  ready: boolean;
  status: StepsStatus;
  todaySteps: number;
  /** The last HISTORY_DAYS days, oldest to newest, ending today. */
  days: DayRecord[];
  /** Monday to Sunday of this week. */
  week: DayRecord[];
  streak: number;
  /** Rest days left in this week's allowance. */
  restLeft: number;
  /** Whether the user chose today as a rest day. */
  todayIsRest: boolean;
  /** Re-reads steps. Resolves to the step status afterwards, or 'failed' if it could not be read. */
  refresh: () => Promise<StepsStatus | 'failed'>;
  /** Ask for access to the step source (Health Connect). Resolves to the status afterwards. */
  connect: () => Promise<StepsStatus>;
  /** Take today as a rest day. False if the week's allowance is used up. */
  takeRestDay: () => boolean;
  undoRestDay: () => void;
};

const [ActivityContext, useActivity] = createRequiredContext<ActivityContextValue>(
  'useActivity',
  'ActivityProvider',
);
export { useActivity };
const LastSyncedContext = createContext<Date | null>(null);

/**
 * Steps and rest days, and everything derived from them: the day-by-day
 * record, the streak, and today's awards. Awards here are for behavior only —
 * reaching the step goal, or taking a rest day — and only ever for today.
 * Must sit inside SettingsProvider and WaypointsProvider.
 */
export function ActivityProvider({
  steps: stepsRepo,
  restDays: restRepo,
  children,
}: {
  steps: StepsRepository;
  restDays: RestDaysRepository;
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const today = useDayKey();

  const [status, setStatus] = useState<StepsStatus>(StepsStatus.Unavailable);
  const [rawStepsByDay, setStepsByDay] = useState<Record<string, number>>({});
  const [restList, setRestList] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  /** Reads steps and rest days. */
  const { ready, reload: load } = useLoader(
    useCallback(async () => {
      const from = addDays(today, -(HISTORY_DAYS - 1));
      const nextStatus = await stepsRepo.status();
      const [steps, rest] = await Promise.all([
        nextStatus === StepsStatus.Connected
          ? stepsRepo.getRange(from, today)
          : Promise.resolve({} as Record<string, number>),
        restRepo.load(from, today),
      ]);
      return { status: nextStatus, steps, rest };
    }, [stepsRepo, restRepo, today]),
    ({ status: nextStatus, steps, rest }) => {
      setStatus((prev) => (prev === nextStatus ? prev : nextStatus));
      setStepsByDay((prev) => (sameSteps(prev, steps) ? prev : steps));
      setRestList((prev) => (sameDays(prev, rest) ? prev : rest));
      setLastSynced(new Date());
    },
    'Could not load activity',
  );
  const persist = usePersist(load);

  // Pick up new steps when the app returns to the foreground, and every few minutes while open.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') load();
    });
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [load]);

  const restSet = useMemo(() => new Set(restList), [restList]);
  // Switching off "read steps" in Settings hides the data without deleting anything.
  const readSteps = settings.healthData.readSteps;
  const stepsByDay = useMemo(
    () => (readSteps ? rawStepsByDay : {}),
    [readSteps, rawStepsByDay],
  );

  const days = useMemo(
    () =>
      buildDays({
        stepsByDay,
        restDays: restSet,
        goalFor: (day) =>
          goalFor(settings.stepGoalHistory, settings.stepGoal, day),
        restPerWeek: settings.restDaysPerWeek,
        autoDetect: settings.autoDetectRestDays,
        today,
        count: HISTORY_DAYS,
      }),
    [
      stepsByDay,
      restSet,
      settings.stepGoal,
      settings.stepGoalHistory,
      settings.restDaysPerWeek,
      settings.autoDetectRestDays,
      today,
    ],
  );

  const week = useMemo(() => weekOf(days, today), [days, today]);
  const streak = useMemo(() => computeStreak(days), [days]);
  const restLeft = restDaysLeft(days, today, settings.restDaysPerWeek);
  const todaySteps = stepsByDay[today] ?? 0;
  const todayIsRest = restSet.has(today);

  // Awards. The waypoints ledger ignores repeats (one per source per day), so
  // these can run freely; they wait for today's ledger so a stale one never decides.
  // Like meals and water, they follow the day as it stands now, not its high-water mark.
  const goalReachedToday = todaySteps >= settings.stepGoal;
  // Steps are only judged while they can be read: with Health Connect
  // disconnected or "read steps" switched off, what was earned stays put.
  const stepsReadable = status === StepsStatus.Connected && readSteps;

  // Lowering the goal to collect the award and raising it again doesn't
  // keep it: today is judged against the goal it ends up with.
  useAward(WaypointSource.Steps, goalReachedToday, ready && stepsReadable);

  // A day is either a goal day or a rest day, never both: a rest day taken
  // early earns its waypoints only if the goal isn't reached after all. So
  // taking one "just in case" is never better than waiting to see.
  const restCounts = todayIsRest && !(stepsReadable && goalReachedToday);
  useAward(WaypointSource.Rest, restCounts, ready);

  const takeRestDay = useCallback(() => {
    if (todayIsRest || restLeft <= 0) return false;
    setRestList((prev) => [...prev, today]);
    persist(restRepo.add(today), REST_FAILURE);
    return true;
  }, [todayIsRest, restLeft, today, restRepo, persist]);

  const undoRestDay = useCallback(() => {
    setRestList((prev) => prev.filter((d) => d !== today));
    persist(restRepo.remove(today), REST_FAILURE);
  }, [today, restRepo, persist]);

  const refresh = useCallback(async () => (await load())?.status ?? 'failed', [load]);

  const connect = useCallback(async (): Promise<StepsStatus> => {
    const granted = await stepsRepo.connect();
    return (await load())?.status ?? granted;
  }, [stepsRepo, load]);

  const value = useMemo<ActivityContextValue>(
    () => ({
      ready,
      status,
      todaySteps,
      days,
      week,
      streak,
      restLeft,
      todayIsRest,
      refresh,
      connect,
      takeRestDay,
      undoRestDay,
    }),
    [
      ready,
      status,
      todaySteps,
      days,
      week,
      streak,
      restLeft,
      todayIsRest,
      refresh,
      connect,
      takeRestDay,
      undoRestDay,
    ],
  );

  return (
    <ActivityContext.Provider value={value}>
      <LastSyncedContext.Provider value={lastSynced}>
        {children}
      </LastSyncedContext.Provider>
    </ActivityContext.Provider>
  );
}

/**
 * When steps were last read. Kept out of the main context on purpose: it changes
 * on every refresh, and only the Health data screen shows it.
 */
export function useLastSynced(): Date | null {
  return useContext(LastSyncedContext);
}
