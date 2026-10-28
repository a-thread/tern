import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { dayNumber, variantFor } from './models/mealMessages';
import {
  isQuietToday,
  NotificationLimits,
  NOTHING_DONE,
  planReminders,
  restDayTriggers,
  rotationDays,
  upcomingDates,
  type DoneToday,
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

/** Days of rotating reminders to schedule; reopening the app tops them up. */
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

/** Cancel scheduled notifications, preserving the selected group. */
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

/** Build dated reminders with wording chosen for each day. */
function rotated(
  r: PlannedReminder,
  now: Date,
  skipToday: boolean,
  days: number,
): { id: string; title: string; body: string; date: Date }[] {
  return upcomingDates(r, now, days, skipToday).map((date, i) => {
    const { title, body } = variantFor(r.variants ?? [r], dayNumber(date));
    return { id: `${r.id}-${i}`, title, body, date };
  });
}

/** Sync reminders, skipping today for goals already met. Resumes at the next sync. */
export async function syncReminders(
  config: ReminderConfig,
  extras?: PlanExtras,
  done: DoneToday = NOTHING_DONE,
): Promise<SyncResult> {
  const plan = planReminders(config, extras);

  // Replace Tern reminders; streak alerts sync separately.
  await cancelScheduled(false);
  if (plan.length === 0) return SyncResult.Ok;
  if (!(await ensurePermission())) return SyncResult.Denied;

  const now = new Date();
  // Keep rotating reminders within iOS's 64-notification limit.
  const days = rotationDays(
    plan,
    Platform.OS === 'ios' ? NotificationLimits.IOS_PENDING : Infinity,
    ROTATE_DAYS,
    (r) => isQuietToday(r, done),
  );
  for (const r of plan) {
    const quiet = isQuietToday(r, done);
    if (r.variants) {
      for (const d of rotated(r, now, quiet, days)) {
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
    // Repeating triggers cannot skip today, so use one-off rest-day triggers.
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
 * Sync streak alerts. With `mayAsk` (a reminder has been chosen) the phone asks for
 * notification permission if it hasn't been given; without it they wait until it is.
 */
export async function syncStreakAlerts(
  input: StreakAlertInput,
  mayAsk = false,
): Promise<void> {
  await cancelScheduled(true);
  const plan = planStreakAlerts(input);
  if (plan.length === 0) return;
  const granted = mayAsk
    ? await ensurePermission()
    : (await Notifications.getPermissionsAsync()).granted;
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
