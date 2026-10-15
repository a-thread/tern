import type { HealthKitApi } from '../health/healthkit';
import { Activity, MovementSource } from './models/movementEntry';
import {
  activityForWorkoutType,
  createHealthKitWorkouts,
  workoutToEntry,
} from './movement.healthkit';

const api = (over: Partial<HealthKitApi> = {}): HealthKitApi => ({
  isAvailable: async () => true,
  needsAuthorization: async () => false,
  requestAuthorization: async () => {},
  dailySteps: async () => [],
  workouts: async () => [],
  ...over,
});

describe('activityForWorkoutType', () => {
  it('maps Apple workout types to Tern activities', () => {
    expect(activityForWorkoutType(37)).toBe(Activity.Run);
    expect(activityForWorkoutType(52)).toBe(Activity.Walk);
    expect(activityForWorkoutType(46)).toBe(Activity.Swim);
    expect(activityForWorkoutType(13)).toBe(Activity.Bike);
    expect(activityForWorkoutType(24)).toBe(Activity.Hike);
    expect(activityForWorkoutType(50)).toBe(Activity.Strength);
    expect(activityForWorkoutType(63)).toBe(Activity.Hiit);
    expect(activityForWorkoutType(57)).toBe(Activity.Yoga);
  });

  it('falls back to Other for anything it does not know', () => {
    expect(activityForWorkoutType(3000)).toBe(Activity.Other);
    expect(activityForWorkoutType(9999)).toBe(Activity.Other);
  });
});

describe('workoutToEntry', () => {
  it('turns a workout into read-only movement on the day it started', () => {
    const e = workoutToEntry({
      id: 'abc',
      start: new Date(2026, 9, 7, 7, 10),
      end: new Date(2026, 9, 7, 7, 45),
      activityType: 46,
    });
    expect(e).toMatchObject({
      id: 'hk-abc',
      day: '2026-10-07',
      activity: Activity.Swim,
      minutes: 35,
      effort: null,
      source: MovementSource.HealthKit,
    });
  });

  it('puts a workout that ends after midnight on the day it started', () => {
    const e = workoutToEntry({
      id: 'late',
      start: new Date(2026, 9, 7, 23, 40),
      end: new Date(2026, 9, 8, 0, 20),
      activityType: 37,
    });
    expect(e?.day).toBe('2026-10-07');
  });

  it('ignores workouts with no usable length', () => {
    const start = new Date(2026, 9, 7, 7, 10);
    expect(
      workoutToEntry({
        id: 'x',
        start,
        end: new Date(start.getTime() + 20_000),
        activityType: 37,
      }),
    ).toBeNull();
    expect(
      workoutToEntry({
        id: 'y',
        start: new Date('x'),
        end: new Date('y'),
        activityType: 37,
      }),
    ).toBeNull();
  });
});

describe('HealthKit workouts', () => {
  it('is null where there is no HealthKit', () => {
    expect(createHealthKitWorkouts(null)).toBeNull();
  });

  it('only asks when told to, and says whether it may read', async () => {
    let needs = true;
    const requestAuthorization = jest.fn(async () => {
      needs = false;
    });
    const source = createHealthKitWorkouts(
      api({ needsAuthorization: async () => needs, requestAuthorization }),
    )!;
    expect(await source.connect()).toBe(false);
    expect(requestAuthorization).not.toHaveBeenCalled();
    expect(await source.connect(true)).toBe(true);
    expect(requestAuthorization).toHaveBeenCalledTimes(1);
    expect(await source.connect(true)).toBe(true); // already asked: no second sheet
    expect(requestAuthorization).toHaveBeenCalledTimes(1);
  });

  it('reads workouts for the range as movement, and nothing before permission', async () => {
    const workouts = jest.fn(async () => [
      {
        id: 'a',
        start: new Date(2026, 9, 7, 8, 0),
        end: new Date(2026, 9, 7, 8, 30),
        activityType: 37,
      },
      {
        id: 'b',
        start: new Date(2026, 9, 7, 9, 0),
        end: new Date(2026, 9, 7, 9, 0, 5),
        activityType: 37,
      },
    ]);
    const source = createHealthKitWorkouts(api({ workouts }))!;
    const entries = await source.getRange('2026-10-07', '2026-10-07');
    expect(entries.map((e) => [e.id, e.minutes])).toEqual([['hk-a', 30]]);
    expect(workouts).toHaveBeenCalledWith(
      new Date(2026, 9, 7),
      new Date(2026, 9, 8),
    );

    const waiting = createHealthKitWorkouts(
      api({ needsAuthorization: async () => true, workouts }),
    )!;
    expect(await waiting.getRange('2026-10-07', '2026-10-07')).toEqual([]);
  });
});
