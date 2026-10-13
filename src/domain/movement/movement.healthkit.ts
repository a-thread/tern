import { addDays, dayKey, parseDayKey } from '@shared/utils/date';
import { loadHealthKit, type HealthKitApi, type HealthKitWorkout } from '../health/healthkit';
import { Activity, isValidMinutes, MovementSource, type MovementEntry } from './models/movementEntry';
import type { WorkoutsSource } from './movement.healthconnect';

/** HKWorkoutActivityType raw values (Apple's numbering) as the activities Tern offers. */
const ACTIVITY_FOR_TYPE: Record<number, Activity> = {
  5: Activity.Other, // baseball
  6: Activity.Basketball,
  8: Activity.Boxing,
  9: Activity.Climbing,
  11: Activity.Circuit, // cross training
  13: Activity.Bike,
  14: Activity.Dancing,
  15: Activity.Dancing,
  16: Activity.Elliptical,
  20: Activity.Strength, // functional strength
  21: Activity.Golf,
  24: Activity.Hike,
  28: Activity.MartialArts,
  29: Activity.Yoga, // mind and body
  30: Activity.Hiit, // mixed metabolic cardio
  31: Activity.Kayaking, // paddle sports
  35: Activity.Rowing,
  37: Activity.Run,
  39: Activity.Skating,
  40: Activity.Skiing, // snow sports
  41: Activity.Soccer,
  44: Activity.Walk, // stair climbing
  46: Activity.Swim,
  48: Activity.Tennis,
  50: Activity.Strength, // traditional strength
  51: Activity.Volleyball,
  52: Activity.Walk,
  53: Activity.Swim, // water fitness
  57: Activity.Yoga,
  58: Activity.Pilates, // barre
  59: Activity.Strength, // core training
  60: Activity.Skiing, // cross-country
  61: Activity.Skiing, // downhill
  62: Activity.Stretching, // flexibility
  63: Activity.Hiit,
  65: Activity.Boxing, // kickboxing
  66: Activity.Pilates,
  67: Activity.Skiing, // snowboarding
  68: Activity.Walk, // stairs
  69: Activity.Aerobics, // step training
  72: Activity.MartialArts, // tai chi
  73: Activity.Aerobics, // mixed cardio
  74: Activity.Bike, // hand cycling
  77: Activity.Dancing, // cardio dance
  78: Activity.Dancing, // social dance
  79: Activity.Pickleball,
};

export const activityForWorkoutType = (type: number): Activity => ACTIVITY_FOR_TYPE[type] ?? Activity.Other;

/** One HealthKit workout as read-only movement on the day it started; null when it has no usable length. */
export function workoutToEntry(w: HealthKitWorkout): MovementEntry | null {
  const minutes = Math.round((w.end.getTime() - w.start.getTime()) / 60_000);
  if (!Number.isFinite(minutes) || !isValidMinutes(minutes)) return null;
  return {
    id: `hk-${w.id}`,
    day: dayKey(w.start),
    activity: activityForWorkoutType(w.activityType),
    minutes,
    effort: null,
    source: MovementSource.HealthKit,
    loggedAt: w.start.toISOString(),
  };
}

/**
 * Workouts from Apple Health on iPhone, read live and never stored. HealthKit asks for steps and
 * workouts in one permission sheet, so connecting either one covers both.
 */
export function createHealthKitWorkouts(health: HealthKitApi | null = loadHealthKit()): WorkoutsSource | null {
  if (!health) return null;

  // "Asked" is as much as HealthKit will tell us; a denied read just returns nothing.
  const asked = async () => {
    try {
      return (await health.isAvailable()) && !(await health.needsAuthorization());
    } catch (e) {
      console.warn('Apple Health workout permission check failed', e);
      return false;
    }
  };

  return {
    connect: async (ask = false) => {
      if ((await asked()) || !ask) return asked();
      try {
        if (await health.isAvailable()) await health.requestAuthorization();
      } catch (e) {
        console.warn('Apple Health workout permission request failed', e);
      }
      return asked();
    },
    getRange: async (from, to) => {
      if (!(await asked())) return [];
      const list = await health.workouts(parseDayKey(from), parseDayKey(addDays(to, 1)));
      return list.map(workoutToEntry).filter((e): e is MovementEntry => e !== null);
    },
  };
}
