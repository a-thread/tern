import { Meal } from '../../food/models/foodEntry';
import { medicationReminderId, Reminders } from './reminderPlan';
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

/**
 * The target of a notification, from the identifier it was scheduled under. Rotated and
 * rest-day copies carry a suffix (`tern-meals-midday-3`, `tern-weigh-in-rest-2`), so the
 * match is on the start. Null for anything Tern didn't schedule.
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
    id.startsWith('tern-water-') ||
    id.startsWith(medicationReminderId(''))
  ) {
    return NotificationTarget.Today;
  }
  return null;
}
