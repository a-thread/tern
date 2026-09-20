import { ALL_REMINDER_IDS, planReminders } from './reminders.plan';

describe('planReminders', () => {
  it('schedules nothing when everything is off', () => {
    expect(planReminders({ meals: false, weighIn: false })).toEqual([]);
  });

  it('schedules two daily meal reminders', () => {
    const plan = planReminders({ meals: true, weighIn: false });
    expect(plan.map((r) => [r.hour, r.minute])).toEqual([
      [12, 30],
      [19, 0],
    ]);
    expect(plan.every((r) => r.weekday === undefined)).toBe(true);
  });

  it('schedules the weigh-in weekly, on Sunday', () => {
    const [r] = planReminders({ meals: false, weighIn: true });
    expect(r).toMatchObject({ weekday: 1, hour: 8, minute: 0 });
  });

  it('uses unique ids that are all known to the canceller', () => {
    const plan = planReminders({ meals: true, weighIn: true });
    const ids = plan.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(ALL_REMINDER_IDS).toContain(id));
  });

  it('never mentions weight loss, calories or streaks', () => {
    const text = planReminders({ meals: true, weighIn: true })
      .map((r) => `${r.title} ${r.body}`)
      .join(' ')
      .toLowerCase();
    expect(text).not.toMatch(/streak|calorie|lose|loss|goal|behind|miss/);
  });
});
