import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { dayNumber, variantFor } from '@settings/models/mealMessages';
import {
  planReminders,
  type PlanExtras,
  type PlannedReminder,
  type ReminderConfig,
} from '@settings/models/reminderPlan';
import {
  planStreakAlerts,
  StreakAlerts,
  type StreakAlertInput,
} from '@settings/models/streakAlerts';

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
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(
    () => [],
  );
  await Promise.all(
    scheduled
      .filter((n) => StreakAlerts.ALL_IDS.includes(n.identifier) === streak)
      .map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}),
      ),
  );
}

/** The one-off dates a rotating reminder fires on, each with that day's wording. */
function rotated(
  r: PlannedReminder,
  now: Date,
): { id: string; title: string; body: string; date: Date }[] {
  const out: { id: string; title: string; body: string; date: Date }[] = [];
  for (let i = 0; i < ROTATE_DAYS; i++) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + i,
      r.hour,
      r.minute,
    );
    if (date <= now) continue;
    const { title, body } = variantFor(r.variants ?? [r], dayNumber(date));
    out.push({ id: `${r.id}-${i}`, title, body, date });
  }
  return out;
}

/** Syncs scheduled reminders with the enabled settings. */
export async function syncReminders(
  config: ReminderConfig,
  extras?: PlanExtras,
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
    if (r.variants) {
      for (const d of rotated(r, now)) {
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
