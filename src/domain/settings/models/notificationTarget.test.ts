import {
  notificationData,
  notificationTarget,
  NotificationTarget,
  reminderTarget,
  streakAlertTarget,
  tappedTarget,
} from './notificationTarget';
import {
  medicationReminderId,
  ReminderKey,
  Reminders,
  waterReminderId,
} from './reminderPlan';
import { StreakAlerts } from './streakAlerts';

describe('notificationTarget', () => {
  it.each([
    [`${Reminders.MIDDAY_MEALS_ID}-3`, NotificationTarget.LogLunch],
    [`${Reminders.EVENING_MEALS_ID}-0`, NotificationTarget.LogDinner],
    [Reminders.WEIGH_IN_ID, NotificationTarget.LogWeight],
    [`${Reminders.WEIGH_IN_ID}-rest-2`, NotificationTarget.LogWeight],
    [Reminders.MOOD_ID, NotificationTarget.CheckIn],
    [`${Reminders.MOOD_ID}-rest-5`, NotificationTarget.CheckIn],
    [`${Reminders.EVENING_EAT_ID}-2`, NotificationTarget.Today],
    [waterReminderId(2), NotificationTarget.Today],
    [`${waterReminderId(0)}-rest-1`, NotificationTarget.Today],
    [medicationReminderId('abc-123'), NotificationTarget.Today],
    [StreakAlerts.AT_RISK_ID, NotificationTarget.Today],
    [StreakAlerts.OUTCOME_ID, NotificationTarget.Streak],
  ])('%s opens %s', (id, target) => {
    expect(notificationTarget(id)).toBe(target);
  });

  it('ignores notifications Tern did not schedule', () => {
    expect(notificationTarget('something-else')).toBeNull();
    expect(notificationTarget('tern-moodier')).toBeNull();
  });
});

describe('reminderTarget', () => {
  it('sends each kind of reminder to what it asks for', () => {
    expect(
      reminderTarget({ id: Reminders.MIDDAY_MEALS_ID, key: ReminderKey.Meals }),
    ).toBe(NotificationTarget.LogLunch);
    expect(
      reminderTarget({
        id: Reminders.EVENING_MEALS_ID,
        key: ReminderKey.Meals,
      }),
    ).toBe(NotificationTarget.LogDinner);
    expect(
      reminderTarget({ id: Reminders.WEIGH_IN_ID, key: ReminderKey.WeighIn }),
    ).toBe(NotificationTarget.LogWeight);
    expect(
      reminderTarget({ id: Reminders.MOOD_ID, key: ReminderKey.Mood }),
    ).toBe(NotificationTarget.CheckIn);
    expect(
      reminderTarget({ id: Reminders.MIDDAY_EAT_ID, key: ReminderKey.Eat }),
    ).toBe(NotificationTarget.Today);
    expect(
      reminderTarget({ id: waterReminderId(1), key: ReminderKey.Water }),
    ).toBe(NotificationTarget.Today);
    expect(
      reminderTarget({ id: medicationReminderId('m1'), key: 'medication' }),
    ).toBe(NotificationTarget.Today);
  });

  it('sends the freeze note to the streak explainer and the evening nudge to Today', () => {
    expect(streakAlertTarget(StreakAlerts.OUTCOME_ID)).toBe(
      NotificationTarget.Streak,
    );
    expect(streakAlertTarget(StreakAlerts.AT_RISK_ID)).toBe(
      NotificationTarget.Today,
    );
  });
});

describe('tappedTarget', () => {
  it('goes where the notification data says, whatever the id', () => {
    expect(
      tappedTarget(notificationData(NotificationTarget.CheckIn), 'renamed-id'),
    ).toBe(NotificationTarget.CheckIn);
  });

  it('falls back to the id for one scheduled without a target, or with a bad one', () => {
    expect(tappedTarget({}, Reminders.WEIGH_IN_ID)).toBe(
      NotificationTarget.LogWeight,
    );
    expect(tappedTarget(undefined, Reminders.MOOD_ID)).toBe(
      NotificationTarget.CheckIn,
    );
    expect(tappedTarget({ target: 'nowhere' }, 'something-else')).toBeNull();
  });
});
