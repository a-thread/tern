import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  ALL_REMINDER_IDS,
  planReminders,
  type ReminderKey,
} from './reminders.plan';

const CHANNEL_ID = 'reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type SyncResult = 'ok' | 'denied';

/** Syncs scheduled reminders with the enabled settings. */
export async function syncReminders(
  on: Record<ReminderKey, boolean>,
): Promise<SyncResult> {
  const plan = planReminders(on);

  await Promise.all(
    ALL_REMINDER_IDS.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
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
      trigger: {
        hour: r.hour,
        minute: r.minute,
        ...(r.weekday ? { weekday: r.weekday } : {}),
        repeats: true,
        channelId: CHANNEL_ID,
      },
    });
  }
  return 'ok';
}
