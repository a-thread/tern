import {
  Activity,
  activityShare,
  ACTIVITY_INFO,
  clampMovementGoal,
  distanceFromDisplay,
  formatDistance,
  searchActivities,
  countsTowardGoal,
  goalMinutesByDay,
  dayMinutes,
  entriesOn,
  isLoggableDay,
  isValidMinutes,
  minutesByDay,
  movementSummary,
  type MovementEntry,
} from './movementEntry';
import { Units } from '@shared/utils/units';

const entry = (day: string, activity: Activity, minutes: number, at = `${day}T08:00:00Z`): MovementEntry => ({
  id: `${day}-${activity}-${minutes}`,
  day,
  activity,
  minutes,
  effort: null,
  source: 'manual',
  loggedAt: at,
});

describe('movementEntry', () => {
  const log = [
    entry('2026-10-07', Activity.Swim, 35),
    entry('2026-10-07', Activity.Walk, 15, '2026-10-07T18:00:00Z'),
    entry('2026-10-06', Activity.Walk, 20),
  ];

  it('totals minutes per day', () => {
    expect(minutesByDay(log)).toEqual({ '2026-10-07': 50, '2026-10-06': 20 });
    expect(dayMinutes(log, '2026-10-07')).toBe(50);
    expect(dayMinutes(log, '2026-10-05')).toBe(0);
  });

  it('counts everything but walks and runs toward a goal day', () => {
    expect(countsTowardGoal(Activity.Swim)).toBe(true);
    expect(countsTowardGoal(Activity.Walk)).toBe(false);
    expect(countsTowardGoal(Activity.Run)).toBe(false);
    expect(goalMinutesByDay(log)).toEqual({ '2026-10-07': 35 });
  });

  it('lists a day earliest first', () => {
    expect(entriesOn(log, '2026-10-07').map((e) => e.activity)).toEqual([Activity.Swim, Activity.Walk]);
  });

  it('allows logging today and yesterday only', () => {
    expect(isLoggableDay('2026-10-08', '2026-10-08')).toBe(true);
    expect(isLoggableDay('2026-10-07', '2026-10-08')).toBe(true);
    expect(isLoggableDay('2026-10-06', '2026-10-08')).toBe(false);
    expect(isLoggableDay('2026-10-09', '2026-10-08')).toBe(false);
  });

  it('checks minutes and keeps the goal in range', () => {
    expect(isValidMinutes(35)).toBe(true);
    expect(isValidMinutes(0)).toBe(false);
    expect(isValidMinutes(601)).toBe(false);
    expect(isValidMinutes(2.5)).toBe(false);
    expect(clampMovementGoal(5)).toBe(10);
    expect(clampMovementGoal(500)).toBe(120);
  });

  it('shares minutes by activity, biggest first', () => {
    expect(activityShare(log).map((a) => [a.activity, Math.round(a.share * 100)])).toEqual([
      [Activity.Swim, 50],
      [Activity.Walk, 50],
    ]);
    expect(activityShare([])).toEqual([]);
  });

  it('finds exercises by search', () => {
    expect(searchActivities('ball').map((a) => ACTIVITY_INFO[a].label)).toEqual([
      'Basketball',
      'Pickleball',
      'Volleyball',
    ]);
    expect(searchActivities('')).toHaveLength(Object.keys(ACTIVITY_INFO).length);
  });

  it('counts steps-based exercises out of goal days, and offers distance where it fits', () => {
    expect(countsTowardGoal(Activity.Hike)).toBe(false);
    expect(countsTowardGoal(Activity.Run)).toBe(false);
    expect(countsTowardGoal(Activity.Dancing)).toBe(true);
    expect(countsTowardGoal(Activity.Shoveling)).toBe(true);
    expect(ACTIVITY_INFO[Activity.Bike].distance).toBe(true);
    expect(ACTIVITY_INFO[Activity.Swim].distance).toBeUndefined();
  });

  it("shows distance in the person's units", () => {
    expect(formatDistance(4023, Units.Imperial)).toBe('2.5 mi');
    expect(formatDistance(4000, Units.Metric)).toBe('4 km');
    expect(distanceFromDisplay(2.5, Units.Imperial)).toBe(4023);
  });

  it('summarises a day', () => {
    expect(movementSummary([entry('d', Activity.Swim, 35)])).toBe('35 min swimming');
    expect(movementSummary(entriesOn(log, '2026-10-07'))).toBe('50 min · swimming and walking');
    expect(movementSummary([])).toBe('');
  });
});
