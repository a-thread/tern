import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { dayNumber, variantFor } from './models/mealMessages';
import {
  planReminders,
  restDayTriggers,
  upcomingDates,
  type PlanExtras,
  type PlannedReminder,
  type ReminderConfig,
} from './models/reminderPlan';
import {
  planStreakAlerts,
  StreakAlerts,
  type StreakAlertInput,
} from './models/streakAlerts';

const CHANNEL_ID = 'reminders';

/**
 * Reminders with alternate wording are scheduled one day at a time this far
 * ahead, so the message can change daily. Reopening the app tops it up.
 */
const ROTATE_DAYS = 14;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export enum SyncResult {
  Ok = 'ok',
  Denied = 'denied',
}

async function ensurePermission(): Promise<boolean> {
  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return true;
}

/** Cancels scheduled notifications, keeping (or only taking) the streak ones. */
async function cancelScheduled(streak: boolean) {
  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((n) => StreakAlerts.ALL_IDS.includes(n.identifier) === streak)
      .map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier).catch(
          () => {},
        ),
      ),
  );
}

/** The one-off dates a rotating reminder fires on, each with that day's wording. */
function rotated(
  r: PlannedReminder,
  now: Date,
  skipToday: boolean,
): { id: string; title: string; body: string; date: Date }[] {
  return upcomingDates(r, now, ROTATE_DAYS, skipToday).map((date, i) => {
    const { title, body } = variantFor(r.variants ?? [r], dayNumber(date));
    return { id: `${r.id}-${i}`, title, body, date };
  });
}

/**
 * Syncs scheduled reminders with the enabled settings. On a rest day (`restToday`) nothing more
 * fires today, except medication, which stays on: a day off from logging isn't a day off from a
 * dose. Meal reminders are already scheduled day by day, so today is simply left out. The others
 * repeat by themselves, so they become weekly repeats for the other six weekdays plus one date
 * a week out for today's weekday (see `restDayTriggers`), and go back to repeating at the next
 * sync (tomorrow, or on undo).
 */
export async function syncReminders(
  config: ReminderConfig,
  extras?: PlanExtras,
  restToday = false,
): Promise<SyncResult> {
  const plan = planReminders(config, extras);

  // Everything scheduled here is one of Tern's reminders (meals, weigh-in and a
  // variable number of medications), so start clean each time. Streak alerts
  // have their own sync and are left alone.
  await cancelScheduled(false);
  if (plan.length === 0) return SyncResult.Ok;
  if (!(await ensurePermission())) return SyncResult.Denied;

  const now = new Date();
  for (const r of plan) {
    const quiet = restToday && r.key !== 'medication';
    if (r.variants) {
      for (const d of rotated(r, now, quiet)) {
        await Notifications.scheduleNotificationAsync({
          identifier: d.id,
          content: { title: d.title, body: d.body },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: d.date,
            channelId: CHANNEL_ID,
          },
        });
      }
      continue;
    }
    // Today's time still to come, on a rest day: a repeating trigger can't skip a day.
    const restTriggers = quiet ? restDayTriggers(r, now) : [];
    if (restTriggers.length) {
      for (const t of restTriggers) {
        await Notifications.scheduleNotificationAsync({
          identifier: t.id,
          content: { title: r.title, body: r.body },
          trigger:
            'date' in t
              ? {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date: t.date,
                  channelId: CHANNEL_ID,
                }
              : {
                  type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                  weekday: t.weekday,
                  hour: r.hour,
                  minute: r.minute,
                  channelId: CHANNEL_ID,
                },
        });
      }
      continue;
    }
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body },
      trigger: r.weekday
        ? {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: r.weekday,
            hour: r.hour,
            minute: r.minute,
            channelId: CHANNEL_ID,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: r.hour,
            minute: r.minute,
            channelId: CHANNEL_ID,
          },
    });
  }
  return SyncResult.Ok;
}

/**
 * Replaces the streak notifications with what `planStreakAlerts` says is due now.
 * Needs no permission prompt of its own: it only schedules if the permission
 * was already granted, so a streak never triggers the first ask.
 */
export async function syncStreakAlerts(input: StreakAlertInput): Promise<void> {
  await cancelScheduled(true);
  const plan = planStreakAlerts(input);
  if (plan.length === 0) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  for (const a of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: a.id,
      content: { title: a.title, body: a.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: a.at,
        channelId: CHANNEL_ID,
      },
    });
  }
}
