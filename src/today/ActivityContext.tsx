import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { useBackend } from '@shared/state/BackendContext';
import { useToast } from '@shared/state/ToastContext';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { useWaypoints } from '@journey/WaypointsContext';
import { waypointRules } from '@journey/models';
import {
  buildDays,
  computeStreak,
  goalFor,
  restDaysLeft,
  weekOf,
  type DayRecord,
} from './models';
import type { StepsStatus } from './steps.repository';
import { sameDays, sameSteps } from './sameData';

/** How much history is read: enough for the 6-month views. */
export const HISTORY_DAYS = 180;
const REFRESH_MS = 5 * 60 * 1000;

const pointsFor = (id: string) =>
  waypointRules.find((r) => r.id === id)?.points ?? 0;
const STEP_GOAL_POINTS = pointsFor('steps');
const REST_DAY_POINTS = pointsFor('rest');

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
  refresh: () => Promise<void>;
  /** Ask for access to the step source (Health Connect). */
  connect: () => Promise<void>;
  /** Take today as a rest day. False if the week's allowance is used up. */
  takeRestDay: () => boolean;
  undoRestDay: () => void;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);
const LastSyncedContext = createContext<Date | null>(null);

/**
 * Steps and rest days, and everything derived from them: the day-by-day
 * record, the streak, and today's awards. Awards here are for behavior only —
 * reaching the step goal, or taking a rest day — and only ever for today.
 * Must sit inside SettingsProvider and WaypointsProvider.
 */
export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const { steps: stepsRepo, restDays: restRepo } = useBackend();
  const { settings } = useSettings();
  const { day: awardDay, addWaypoints, revokeWaypoints } = useWaypoints();
  const toast = useToast();
  const today = useDayKey();

  const [status, setStatus] = useState<StepsStatus>('unavailable');
  const [rawStepsByDay, setStepsByDay] = useState<Record<string, number>>({});
  const [restList, setRestList] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const from = addDays(today, -(HISTORY_DAYS - 1));
    try {
      const nextStatus = await stepsRepo.status();
      const [steps, rest] = await Promise.all([
        nextStatus === 'connected'
          ? stepsRepo.getRange(from, today)
          : Promise.resolve({} as Record<string, number>),
        restRepo.load(from, today),
      ]);
      if (!mounted.current) return;
      setStatus((prev) => (prev === nextStatus ? prev : nextStatus));
      setStepsByDay((prev) => (sameSteps(prev, steps) ? prev : steps));
      setRestList((prev) => (sameDays(prev, rest) ? prev : rest));
      setLastSynced(new Date());
    } catch (e) {
      console.warn('Could not load activity', e);
    }
  }, [stepsRepo, restRepo, today]);

  useEffect(() => {
    mounted.current = true;
    load().finally(() => mounted.current && setReady(true));
    return () => {
      mounted.current = false;
    };
  }, [load]);

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
  useEffect(() => {
    if (!ready || awardDay !== today) return;
    if (status === 'connected' && todaySteps >= settings.stepGoal) {
      addWaypoints(STEP_GOAL_POINTS, 'steps');
    }
  }, [
    ready,
    awardDay,
    today,
    status,
    todaySteps,
    settings.stepGoal,
    addWaypoints,
  ]);

  useEffect(() => {
    if (!ready || awardDay !== today) return;
    if (todayIsRest) addWaypoints(REST_DAY_POINTS, 'rest');
    else revokeWaypoints(REST_DAY_POINTS, 'rest');
  }, [ready, awardDay, today, todayIsRest, addWaypoints, revokeWaypoints]);

  const saveFailed = useCallback(
    (e: unknown) => {
      console.warn('Could not save rest day', e);
      toast.show("Couldn't save that rest day — please try again.");
      load();
    },
    [toast, load],
  );

  const takeRestDay = useCallback(() => {
    if (todayIsRest || restLeft <= 0) return false;
    setRestList((prev) => [...prev, today]);
    restRepo.add(today).catch(saveFailed);
    return true;
  }, [todayIsRest, restLeft, today, restRepo, saveFailed]);

  const undoRestDay = useCallback(() => {
    setRestList((prev) => prev.filter((d) => d !== today));
    restRepo.remove(today).catch(saveFailed);
  }, [today, restRepo, saveFailed]);

  const connect = useCallback(async () => {
    await stepsRepo.connect();
    await load();
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
      refresh: load,
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
      load,
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

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}
