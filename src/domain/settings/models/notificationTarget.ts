import { Meal } from '../../food/models/foodEntry';
import { ReminderKey, Reminders, type PlannedReminder } from './reminderPlan';
import { StreakAlerts } from './streakAlerts';

/** Where tapping a notification takes someone: the thing it asked them to do. */
export enum NotificationTarget {
  LogLunch = 'logLunch',
  LogDinner = 'logDinner',
  LogWeight = 'logWeight',
  CheckIn = 'checkIn',
  /** Water and medication are marked from their rows on Today, and the streak is shown there. */
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

/**
 * Where a reminder's tap goes, from what kind of reminder it is. Scheduled into the
 * notification's `data` (`notificationData`), so a tap needn't work it out from the id.
 */
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

/**
 * Where a tapped notification goes: the target in its `data`, or, for one scheduled before
 * targets were (or with none), from the identifier it was scheduled under. Null for anything
 * Tern didn't schedule.
 */
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

/**
 * The target of a notification, from the identifier it was scheduled under: the fallback for
 * notifications scheduled without a target in their data. Rotated and rest-day copies carry a
 * suffix (`tern-meals-midday-3`, `tern-weigh-in-rest-2`), so the match is on the start. Null
 * for anything Tern didn't schedule.
 */
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
    starts(Reminders.WATER_ID_PREFIX) ||
    starts(Reminders.MEDICATION_ID_PREFIX)
  ) {
    return NotificationTarget.Today;
  }
  return null;
}
