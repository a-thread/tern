import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  planReminders,
  type PlanExtras,
  type ReminderConfig,
} from './reminders.plan';

const CHANNEL_ID = 'reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type SyncResult = 'ok' | 'denied';

/** Syncs scheduled reminders with the enabled settings. */
export async function syncReminders(
  config: ReminderConfig,
  extras?: PlanExtras,
): Promise<SyncResult> {
  const plan = planReminders(config, extras);

  // Everything scheduled here is one of Tern's reminders (meals, weigh-in and a
  // variable number of medications), so start clean each time.
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  if (plan.length === 0) return 'ok';

  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) return 'denied';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  for (const r of plan) {
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
  return 'ok';
}
