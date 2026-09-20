import {
  ALL_REMINDER_IDS,
  DEFAULT_REMINDERS,
  describeReminders,
  formatMinutes,
  mergeReminders,
  planReminders,
  stepMinutes,
  stepWeekday,
  type ReminderConfig,
} from './reminders.plan';

const config = (
  over: Partial<{ meals: boolean; weighIn: boolean }> = {},
): ReminderConfig => ({
  mealLog: { ...DEFAULT_REMINDERS.mealLog, on: over.meals ?? false },
  weeklyWeighIn: {
    ...DEFAULT_REMINDERS.weeklyWeighIn,
    on: over.weighIn ?? false,
  },
});

describe('planReminders', () => {
  it('schedules nothing when everything is off', () => {
    expect(planReminders(config())).toEqual([]);
  });

  it('schedules two daily meal reminders at the configured times', () => {
    const plan = planReminders(config({ meals: true }));
    expect(plan.map((r) => [r.hour, r.minute])).toEqual([
      [12, 30],
      [19, 0],
    ]);
    expect(plan.every((r) => r.weekday === undefined)).toBe(true);
  });

  it('follows edited times and weekday', () => {
    const c = config({ meals: true, weighIn: true });
    c.mealLog.midday = 13 * 60 + 15;
    c.weeklyWeighIn.weekday = 4;
    c.weeklyWeighIn.at = 7 * 60 + 45;
    const plan = planReminders(c);
    expect(plan[0]).toMatchObject({ hour: 13, minute: 15 });
    expect(plan[2]).toMatchObject({ weekday: 4, hour: 7, minute: 45 });
  });

  it('uses unique ids that are all known to the canceller', () => {
    const ids = planReminders(config({ meals: true, weighIn: true })).map(
      (r) => r.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(ALL_REMINDER_IDS).toContain(id));
  });

  it('never mentions weight loss, calories or streaks', () => {
    const text = planReminders(config({ meals: true, weighIn: true }))
      .map((r) => `${r.title} ${r.body}`)
      .join(' ')
      .toLowerCase();
    expect(text).not.toMatch(/streak|calorie|lose|loss|goal|behind|miss/);
  });
});

describe('time helpers', () => {
  it('steps and wraps around midnight', () => {
    expect(stepMinutes(23 * 60 + 45, 15)).toBe(0);
    expect(stepMinutes(0, -15)).toBe(23 * 60 + 45);
    expect(stepMinutes(750, 15)).toBe(765);
  });

  it('wraps weekdays', () => {
    expect(stepWeekday(7, 1)).toBe(1);
    expect(stepWeekday(1, -1)).toBe(7);
    expect(stepWeekday(3, 2)).toBe(5);
  });

  it('formats times and schedules', () => {
    expect(formatMinutes(0)).toBe('12:00 am');
    expect(formatMinutes(750)).toBe('12:30 pm');
    expect(formatMinutes(19 * 60 + 5)).toBe('7:05 pm');
    expect(describeReminders(DEFAULT_REMINDERS)).toEqual({
      meals: '12:30 pm and 7:00 pm',
      weighIn: 'Sundays, 8:00 am',
    });
  });
});

describe('mergeReminders', () => {
  it('fills in defaults for an older save that only had text times', () => {
    const merged = mergeReminders({
      mealLog: { on: false, time: '12:30 pm, 7:00 pm' },
      weeklyWeighIn: { on: true, time: 'Sundays, 8:00 am' },
    });
    expect(merged.mealLog).toEqual({ ...DEFAULT_REMINDERS.mealLog, on: false });
    expect(merged.weeklyWeighIn).toEqual(DEFAULT_REMINDERS.weeklyWeighIn);
  });

  it('keeps valid saved values and ignores junk', () => {
    const merged = mergeReminders({ mealLog: { midday: 600, evening: 'x' } });
    expect(merged.mealLog.midday).toBe(600);
    expect(merged.mealLog.evening).toBe(DEFAULT_REMINDERS.mealLog.evening);
    expect(mergeReminders(null)).toEqual(DEFAULT_REMINDERS);
  });
});
