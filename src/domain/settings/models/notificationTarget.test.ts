import { notificationTarget, NotificationTarget } from './notificationTarget';
import {
  medicationReminderId,
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
