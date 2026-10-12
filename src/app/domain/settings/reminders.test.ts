import * as Notifications from 'expo-notifications';

import { Frequency } from '@/shared/models/frequency';
import { Reminders, type ReminderConfig } from '@/domain/settings/models/reminderPlan';
import { syncReminders } from '@/domain/settings/reminders';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationChannelAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly' },
}));

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const ids = () => schedule.mock.calls.map(([r]) => r.identifier as string);

const config: ReminderConfig = {
  mealLog: { ...Reminders.DEFAULTS.mealLog, on: false },
  weighIn: { ...Reminders.DEFAULTS.weighIn, on: false },
  water: { ...Reminders.DEFAULTS.water, on: false },
  mood: { on: true, at: 12 * 60 },
  streak: { on: false },
};
const med = { id: 'm', name: 'Iron', at: 12 * 60, remind: true, frequency: Frequency.Daily, weekday: 1 } as const;

describe('syncReminders on a rest day', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 10, 10, 0));
    schedule.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('repeats as usual on an ordinary day', async () => {
    await syncReminders(config, { trackMood: true });
    expect(ids()).toEqual(['tern-mood']);
  });

  it('replaces the repeating trigger with six weekly repeats and one date, leaving today out', async () => {
    await syncReminders(config, { trackMood: true }, true);
    expect(ids()).toHaveLength(7);
    expect(ids().every((id) => id.startsWith('tern-mood-rest-'))).toBe(true);
    const dates = schedule.mock.calls.filter(([r]) => r.trigger.type === 'date');
    expect(dates).toHaveLength(1);
    expect(dates[0][0].trigger.date).toEqual(new Date(2026, 9, 17, 12, 0));
  });

  it('keeps the usual repeat when its time has already passed today', async () => {
    await syncReminders({ ...config, mood: { on: true, at: 8 * 60 } }, { trackMood: true }, true);
    expect(ids()).toEqual(['tern-mood']);
  });

  it('leaves medication reminders on', async () => {
    await syncReminders({ ...config, mood: { on: false, at: 0 } }, { medications: [med] }, true);
    expect(schedule.mock.calls.map(([r]) => r.trigger.type)).toEqual(['daily']);
  });
});
