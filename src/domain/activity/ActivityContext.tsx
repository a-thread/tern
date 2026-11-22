import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useLoader } from '@shared/hooks/useLoader';
import { usePersist } from '@shared/hooks/usePersist';
import { addDays } from '@shared/utils/date';
import { useSettings } from '../settings/SettingsContext';
import { useAward } from '../waypoints/hooks/useAward';
import {
  addsToStreak,
  buildDays,
  restDaysLeft,
  weekOf,
  withFreezes,
  type DayRecord,
} from './models/dayRecord';
import { goalFor } from '../settings/models/stepGoalHistory';
import { StepsRepository } from './steps.repository';
import { StepsStatus } from './models/stepsStatus';
import type { RestDaysRepository } from './restDays.repository';
import { sameDays, sameSteps } from './utils/sameData';
import { streakBonus, WaypointSource } from '../waypoints/models/waypoint';
import { useMovement } from '../movement/MovementContext';

/** How much history is read: enough for the 6-month views. */
export const HISTORY_DAYS = 180;
const REFRESH_MS = 5 * 60 * 1000;
const REST_FAILURE = {
  log: 'Could not save rest day',
  toast: "Couldn't save that rest day — please try again.",
};

type ActivityContextValue = {
  ready: boolean;
  status: StepsStatus;
  /** Connected and "Read steps" on: the one test for whether step data means anything. */
  stepsReadable: boolean;
  /** By steps, or by movement while it's tracked. */
  goalReachable: boolean;
  todaySteps: number;
  /** HISTORY_DAYS days, oldest to newest. */
  days: DayRecord[];
  week: DayRecord[];
  streak: number;
  freezes: number;
  restLeft: number;
  todayIsRest: boolean;
  refresh: () => Promise<StepsStatus | 'failed'>;
  connect: () => Promise<StepsStatus>;
  /** False if the week's allowance is used up. */
  takeRestDay: () => boolean;
  /** Today (default) or yesterday only. */
  undoRestDay: (day?: string) => void;
};

const [ActivityContext, useActivity] =
  createRequiredContext<ActivityContextValue>(
    'useActivity',
    'ActivityProvider',
  );
export { useActivity };
const LastSyncedContext = createContext<Date | null>(null);

/** Steps, rest days, the streak and today's step/rest awards. Inside Settings and Waypoints. */
export function ActivityProvider({
  steps: stepsRepo,
  restDays: restRepo,
  children,
}: {
  steps: StepsRepository;
  restDays: RestDaysRepository;
  children: React.ReactNode;
}) {
  const { settings, ready: settingsReady } = useSettings();
  const today = useDayKey();
  const movement = useMovement();
  const movementGoal = movement.enabled ? settings.movementGoalMinutes : 0;

  const [status, setStatus] = useState<StepsStatus>(StepsStatus.Unavailable);
  const [rawStepsByDay, setStepsByDay] = useState<Record<string, number>>({});
  const [restList, setRestList] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

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
  // "Read steps" off hides the data without deleting it.
  const readSteps = settings.healthData.readSteps;
  const stepsByDay = useMemo(
    () => (readSteps ? rawStepsByDay : {}),
    [readSteps, rawStepsByDay],
  );

  const recorded = useMemo(
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
        minutesByDay: movement.goalMinutesByDay,
        movementGoal,
      }),
    [
      movement.goalMinutesByDay,
      movementGoal,
      stepsByDay,
      restSet,
      settings.stepGoal,
      settings.stepGoalHistory,
      settings.restDaysPerWeek,
      settings.autoDetectRestDays,
      today,
    ],
  );

  const { days, streak, freezes } = useMemo(
    () => withFreezes(recorded),
    [recorded],
  );
  const week = useMemo(() => weekOf(days, today), [days, today]);
  const restLeft = restDaysLeft(days, today, settings.restDaysPerWeek);
  const todaySteps = stepsByDay[today] ?? 0;
  const todayIsRest = restSet.has(today);

  const goalReachedToday = todaySteps >= settings.stepGoal;
  const movedToGoalToday =
    movementGoal > 0 && movement.todayGoalMinutes >= movementGoal;
  // Unreadable steps leave what was earned alone.
  const stepsReadable = status === StepsStatus.Connected && readSteps;
  // Before settings load the goal is only the default, and an early award would make an
  // empty phone look in use and skip the wizard.
  const judging = ready && settingsReady;

  // Judged against the goal as it ends up, so lowering it and raising it again doesn't keep it.
  useAward(
    WaypointSource.Steps,
    goalReachedToday || movedToGoalToday,
    judging && movement.ready && (stepsReadable || movementGoal > 0),
  );

  useAward(WaypointSource.Rest, todayIsRest, judging);

  // Paid on the day the streak reaches a milestone. If today falls short, the streak drops a
  // day and the bonus is revoked at the amount given (the next milestone's).
  const lastDay = days[days.length - 1];
  const reachedToday = lastDay ? addsToStreak(lastDay) : false;
  const bonus = streakBonus(streak);
  useAward(
    WaypointSource.Streak,
    reachedToday && bonus > 0,
    judging && movement.ready && (stepsReadable || movementGoal > 0),
    { points: bonus > 0 ? bonus : streakBonus(streak + 1) },
  );

  const takeRestDay = useCallback(() => {
    if (todayIsRest || restLeft <= 0) return false;
    setRestList((prev) => [...prev, today]);
    persist(restRepo.add(today), REST_FAILURE);
    return true;
  }, [todayIsRest, restLeft, today, restRepo, persist]);

  const undoRestDay = useCallback(
    (day: string = today) => {
      if (day !== today && day !== addDays(today, -1)) return;
      setRestList((prev) => prev.filter((d) => d !== day));
      persist(restRepo.remove(day), REST_FAILURE);
    },
    [today, restRepo, persist],
  );

  const refresh = useCallback(
    async () => (await load())?.status ?? 'failed',
    [load],
  );

  const connect = useCallback(async (): Promise<StepsStatus> => {
    const granted = await stepsRepo.connect();
    return (await load())?.status ?? granted;
  }, [stepsRepo, load]);

  const value = useMemo<ActivityContextValue>(
    () => ({
      ready,
      status,
      stepsReadable,
      goalReachable: stepsReadable || movementGoal > 0,
      todaySteps,
      days,
      week,
      streak,
      freezes,
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
      stepsReadable,
      movementGoal,
      todaySteps,
      days,
      week,
      streak,
      freezes,
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

/** Separate from the main context: it changes every refresh and only one screen reads it. */
export function useLastSynced(): Date | null {
  return useContext(LastSyncedContext);
}
