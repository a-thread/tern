import { Meal } from '../../food/models/foodEntry';
import { ReminderKey, Reminders, type PlannedReminder } from './reminderPlan';
import { StreakAlerts } from './streakAlerts';

/** Where tapping a notification takes someone: the thing it asked them to do. */
export enum NotificationTarget {
  LogLunch = 'logLunch',
  LogDinner = 'logDinner',
  LogWeight = 'logWeight',
  CheckIn = 'checkIn',
  /** Water, medication, streak, and eat reminders (nothing to log). */
  Today = 'today',
  /** What a streak freeze did, after one held the streak overnight. */
  Streak = 'streak',
}

/** The meal a meal target opens logging for. */
export const targetMeal = (
  t: NotificationTarget.LogLunch | NotificationTarget.LogDinner,
): Meal => (t === NotificationTarget.LogLunch ? Meal.Lunch : Meal.Dinner);

/** What a notification carries in its `data`, so a tap knows where to go. */
export type NotificationData = { target: NotificationTarget };

/** Stored in the notification's `data`, so a tap needn't parse the id. */
export function reminderTarget(
  r: Pick<PlannedReminder, 'id' | 'key'>,
): NotificationTarget {
  switch (r.key) {
    case ReminderKey.Meals:
      return r.id === Reminders.EVENING_MEALS_ID
        ? NotificationTarget.LogDinner
        : NotificationTarget.LogLunch;
    case ReminderKey.WeighIn:
      return NotificationTarget.LogWeight;
    case ReminderKey.Mood:
      return NotificationTarget.CheckIn;
    case ReminderKey.Eat:
    case ReminderKey.Water:
    case ReminderKey.Streak:
    case 'medication':
      return NotificationTarget.Today;
  }
}

/** Where a streak alert's tap goes: the morning freeze note explains itself, the rest go to Today. */
export const streakAlertTarget = (id: string): NotificationTarget =>
  id === StreakAlerts.OUTCOME_ID
    ? NotificationTarget.Streak
    : NotificationTarget.Today;

export const notificationData = (
  target: NotificationTarget,
): NotificationData => ({
  target,
});

/** From `data`, falling back to the id for older notifications; null if not Tern's. */
export function tappedTarget(
  data: unknown,
  id: string,
): NotificationTarget | null {
  const target = (data as Partial<NotificationData> | null | undefined)?.target;
  return Object.values(NotificationTarget).includes(
    target as NotificationTarget,
  )
    ? (target as NotificationTarget)
    : notificationTarget(id);
}

/** Matches on the id's start, since rotated copies carry a suffix (`tern-meals-midday-3`). */
export function notificationTarget(id: string): NotificationTarget | null {
  const starts = (prefix: string) =>
    id === prefix || id.startsWith(`${prefix}-`);
  if (starts(Reminders.MIDDAY_MEALS_ID)) return NotificationTarget.LogLunch;
  if (starts(Reminders.EVENING_MEALS_ID)) return NotificationTarget.LogDinner;
  if (starts(Reminders.WEIGH_IN_ID)) return NotificationTarget.LogWeight;
  if (starts(Reminders.MOOD_ID)) return NotificationTarget.CheckIn;
  if (id === StreakAlerts.OUTCOME_ID) return NotificationTarget.Streak;
  if (
    id === StreakAlerts.AT_RISK_ID ||
    starts(Reminders.EAT_ID_PREFIX) ||
    starts(Reminders.WATER_ID_PREFIX) ||
    starts(Reminders.MEDICATION_ID_PREFIX)
  ) {
    return NotificationTarget.Today;
  }
  return null;
}
