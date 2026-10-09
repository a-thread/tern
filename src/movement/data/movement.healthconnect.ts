import { addDays, dayKey, parseDayKey } from '@shared/utils/date';
import { Activity, isValidMinutes, type MovementEntry } from '@movement/models/movementEntry';

/** Workouts read from somewhere outside Tern (Health Connect). Read-only: never stored. */
export interface WorkoutsSource {
  /** Whether Tern may read workouts; asks for permission when `ask` is true. */
  connect(ask?: boolean): Promise<boolean>;
  /** Workouts from day `from` to `to` inclusive, as movement entries. */
  getRange(from: string, to: string): Promise<MovementEntry[]>;
}

/** Health Connect's exercise type names, read as the activities Tern offers. */
export function activityForExercise(name: string | undefined): Activity {
  const n = (name ?? '').toUpperCase();
  if (/WALK|HIK/.test(n)) return Activity.Walk;
  if (/RUN/.test(n)) return Activity.Run;
  if (/BIK|CYCL/.test(n)) return Activity.Bike;
  if (/SWIM/.test(n)) return Activity.Swim;
  if (/STRENGTH|WEIGHT|CALISTHENICS/.test(n)) return Activity.Strength;
  if (/YOGA|PILATES|STRETCH/.test(n)) return Activity.Yoga;
  if (/CLASS|DANC|BOOT_CAMP|HIGH_INTENSITY|AEROBIC|SPINNING/.test(n)) return Activity.Class;
  return Activity.Other;
}

// The common Health Connect exercise types, by number, for when the library doesn't name them.
const EXERCISE_NAMES: Record<number, string> = {
  8: 'BIKING',
  9: 'BIKING_STATIONARY',
  36: 'HIGH_INTENSITY_INTERVAL_TRAINING',
  48: 'PILATES',
  56: 'RUNNING',
  57: 'RUNNING_TREADMILL',
  70: 'STRENGTH_TRAINING',
  73: 'SWIMMING_OPEN_WATER',
  74: 'SWIMMING_POOL',
  79: 'WALKING',
  81: 'WEIGHTLIFTING',
  83: 'YOGA',
};

export type ExerciseSessionRecord = {
  startTime: string;
  endTime: string;
  exerciseType?: number;
  metadata?: { id?: string };
};

/** One recorded workout as movement on the day it started; null when it has no usable length. */
export function sessionToEntry(
  r: ExerciseSessionRecord,
  nameOf: (type: number | undefined) => string | undefined = (t) => (t === undefined ? undefined : EXERCISE_NAMES[t]),
): MovementEntry | null {
  const start = Date.parse(r.startTime);
  const end = Date.parse(r.endTime);
  const minutes = Math.round((end - start) / 60_000);
  if (!Number.isFinite(minutes) || !isValidMinutes(minutes)) return null;
  return {
    id: `hc-${r.metadata?.id ?? r.startTime}`,
    day: dayKey(new Date(start)),
    activity: activityForExercise(nameOf(r.exerciseType)),
    minutes,
    effort: null,
    source: 'healthConnect',
    loggedAt: new Date(start).toISOString(),
  };
}

/**
 * Workouts from Android Health Connect, under the same switch as steps
 * (EXPO_PUBLIC_HEALTH_CONNECT=1, see docs/health-connect.md); null otherwise.
 */
export function createHealthConnectWorkouts(): WorkoutsSource | null {
  if (process.env.EXPO_PUBLIC_HEALTH_CONNECT !== '1') return null;
  let hc: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    hc = require('react-native-health-connect');
  } catch {
    return null;
  }
  if (typeof hc?.readRecords !== 'function') return null;

  const read = { accessType: 'read', recordType: 'ExerciseSession' };
  // The library's own names when it has them (ExerciseType.WALKING = 79), else the table above.
  const names: Record<number, string> = hc.ExerciseType
    ? Object.fromEntries(Object.entries(hc.ExerciseType as Record<string, number>).map(([k, v]) => [v, k]))
    : EXERCISE_NAMES;

  const granted = async () => {
    try {
      await hc.initialize();
      const list: { accessType: string; recordType: string }[] = await hc.getGrantedPermissions();
      return list.some((p) => p.recordType === 'ExerciseSession' && p.accessType === 'read');
    } catch (e) {
      console.warn('Health Connect workout permission check failed', e);
      return false;
    }
  };

  return {
    connect: async (ask = false) => {
      if ((await granted()) || !ask) return granted();
      try {
        await hc.requestPermission([read]);
      } catch (e) {
        console.warn('Health Connect workout permission request failed', e);
      }
      return granted();
    },
    getRange: async (from, to) => {
      if (!(await granted())) return [];
      const res: { records?: ExerciseSessionRecord[] } = await hc.readRecords('ExerciseSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: parseDayKey(from).toISOString(),
          endTime: parseDayKey(addDays(to, 1)).toISOString(),
        },
      });
      return (res.records ?? [])
        .map((r) => sessionToEntry(r, (t) => (t === undefined ? undefined : (names[t] ?? EXERCISE_NAMES[t]))))
        .filter((e): e is MovementEntry => !!e);
    },
  };
}
