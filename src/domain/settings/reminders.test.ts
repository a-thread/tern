import * as Notifications from 'expo-notifications';

import { Frequency } from '@shared/models/frequency';
import {
  medicationReminderId,
  NOTHING_DONE,
  Reminders,
  type ReminderConfig,
} from './models/reminderPlan';
import { syncReminders, syncStreakAlerts } from './reminders';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationChannelAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    DAILY: 'daily',
    WEEKLY: 'weekly',
  },
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
const med = {
  id: 'm',
  name: 'Iron',
  at: 12 * 60,
  remind: true,
  frequency: Frequency.Daily,
  weekday: 1,
} as const;

const REST = { ...NOTHING_DONE, rest: true };

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
    await syncReminders(config, { trackMood: true }, REST);
    expect(ids()).toHaveLength(7);
    expect(ids().every((id) => id.startsWith('tern-mood-rest-'))).toBe(true);
    const dates = schedule.mock.calls.filter(
      ([r]) => r.trigger.type === 'date',
    );
    expect(dates).toHaveLength(1);
    expect(dates[0][0].trigger.date).toEqual(new Date(2026, 9, 17, 12, 0));
  });

  it('keeps the usual repeat when its time has already passed today', async () => {
    await syncReminders(
      { ...config, mood: { on: true, at: 8 * 60 } },
      { trackMood: true },
      REST,
    );
    expect(ids()).toEqual(['tern-mood']);
  });

  it('leaves medication reminders on', async () => {
    await syncReminders(
      { ...config, mood: { on: false, at: 0 } },
      { medications: [med] },
      REST,
    );
    expect(schedule.mock.calls.map(([r]) => r.trigger.type)).toEqual(['daily']);
  });
});

describe('syncReminders when the goal is already met', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 10, 10, 0));
    schedule.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('quietens the check-in once it is done today, and no other reminder', async () => {
    await syncReminders(
      { ...config, water: { ...config.water, on: true, everyHours: 4 } },
      { trackMood: true, trackWater: true },
      { ...NOTHING_DONE, mood: true },
    );
    expect(ids().filter((id) => id.startsWith('tern-mood'))).toHaveLength(7);
    expect(ids().filter((id) => id.startsWith('tern-water'))).toEqual([
      'tern-water-0',
      'tern-water-1',
      'tern-water-2',
    ]);
  });

  it('quietens the water reminders once the goal is reached', async () => {
    await syncReminders(
      {
        ...config,
        mood: { on: false, at: 0 },
        water: { ...config.water, on: true, everyHours: 4 },
      },
      { trackWater: true },
      { ...NOTHING_DONE, water: true },
    );
    // 9:00 has passed (it is 10:00), so it keeps repeating; 13:00 and 17:00 skip today.
    expect(ids().filter((id) => id === 'tern-water-0')).toHaveLength(1);
    expect(
      ids().filter((id) => id.startsWith('tern-water-1-rest-')),
    ).toHaveLength(7);
    expect(
      ids().filter((id) => id.startsWith('tern-water-2-rest-')),
    ).toHaveLength(7);
  });

  it('leaves today out of the meal reminders once every meal is logged', async () => {
    const meals = {
      ...config,
      mood: { on: false, at: 0 },
      mealLog: { on: true, midday: 12 * 60, evening: 19 * 60 },
    };
    await syncReminders(meals);
    const usual = schedule.mock.calls.filter(
      ([r]) => r.trigger.date.getDate() === 10,
    );
    expect(usual).toHaveLength(2);

    schedule.mockClear();
    await syncReminders(meals, undefined, { ...NOTHING_DONE, meals: true });
    expect(
      schedule.mock.calls.some(([r]) => r.trigger.date.getDate() === 10),
    ).toBe(false);
    expect(
      schedule.mock.calls.some(([r]) => r.trigger.date.getDate() === 11),
    ).toBe(true);
  });

  it('quietens only the medication that was taken', async () => {
    const other = { ...med, id: 'o', name: 'Zinc' };
    await syncReminders(
      { ...config, mood: { on: false, at: 0 } },
      { medications: [med, other] },
      { ...NOTHING_DONE, medications: ['m'] },
    );
    expect(
      ids().filter((id) => id.startsWith(medicationReminderId('m'))),
    ).toHaveLength(7);
    expect(ids()).toContain(medicationReminderId('o'));
  });
});

describe('syncStreakAlerts without notification permission', () => {
  const streakOnly = {
    on: true,
    streak: 3,
    freezes: 1,
    todayOpen: true,
    now: new Date(2026, 9, 27, 9, 0),
  };
  const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
  const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getPermissions.mockResolvedValueOnce({ granted: false });
  });

  it('asks for it once a reminder has been chosen, then schedules', async () => {
    await syncStreakAlerts(streakOnly, true);
    expect(requestPermissions).toHaveBeenCalled();
    expect(schedule).toHaveBeenCalled();
  });

  it('waits for it, without asking, before then', async () => {
    await syncStreakAlerts(streakOnly);
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });
});
