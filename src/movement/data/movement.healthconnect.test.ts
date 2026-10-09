import { Activity } from '@movement/models/movementEntry';
import { activityForExercise, sessionToEntry } from './movement.healthconnect';

describe('Health Connect workouts', () => {
  it('reads exercise types as Tern activities', () => {
    expect(activityForExercise('WALKING')).toBe(Activity.Walk);
    expect(activityForExercise('RUNNING_TREADMILL')).toBe(Activity.Run);
    expect(activityForExercise('BIKING_STATIONARY')).toBe(Activity.Bike);
    expect(activityForExercise('SWIMMING_POOL')).toBe(Activity.Swim);
    expect(activityForExercise('WEIGHTLIFTING')).toBe(Activity.Strength);
    expect(activityForExercise('PILATES')).toBe(Activity.Yoga);
    expect(activityForExercise('HIGH_INTENSITY_INTERVAL_TRAINING')).toBe(Activity.Class);
    expect(activityForExercise('FENCING')).toBe(Activity.Other);
    expect(activityForExercise(undefined)).toBe(Activity.Other);
  });

  it('turns a session into read-only movement on the day it started', () => {
    const e = sessionToEntry({
      startTime: '2026-10-07T07:10:00Z',
      endTime: '2026-10-07T07:45:00Z',
      exerciseType: 74,
      metadata: { id: 'abc' },
    });
    expect(e).toMatchObject({ id: 'hc-abc', activity: Activity.Swim, minutes: 35, source: 'healthConnect', effort: null });
  });

  it('ignores sessions with no usable length', () => {
    expect(sessionToEntry({ startTime: '2026-10-07T07:10:00Z', endTime: '2026-10-07T07:10:20Z' })).toBeNull();
    expect(sessionToEntry({ startTime: 'x', endTime: 'y' })).toBeNull();
  });
});
