import {
  ALL_REMINDER_IDS,
  DEFAULT_REMINDERS,
  describeReminders,
  formatMinutes,
  mergeReminders,
  medicationReminderId,
  planReminders,
  waterReminderId,
  waterTimes,
  stepMinutes,
  stepWeekday,
  type ReminderConfig,
} from './reminders.plan';

const config = (
  over: Partial<{ meals: boolean; weighIn: boolean }> = {},
): ReminderConfig => ({
  mealLog: { ...DEFAULT_REMINDERS.mealLog, on: over.meals ?? false },
  weighIn: {
    ...DEFAULT_REMINDERS.weighIn,
    on: over.weighIn ?? false,
  },
  water: { ...DEFAULT_REMINDERS.water, on: false },
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
    c.weighIn.weekday = 4;
    c.weighIn.at = 7 * 60 + 45;
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
    const text = planReminders(config({ meals: true, weighIn: true }), { weighInFrequency: 'daily' })
      .map((r) => `${r.title} ${r.body}`)
      .join(' ')
      .toLowerCase();
    expect(text).not.toMatch(/streak|calorie|lose|loss|goal|behind|miss/);
  });
});

describe('weigh-in frequency', () => {
  it('is weekly by default, on the chosen weekday', () => {
    const [r] = planReminders(config({ weighIn: true }));
    expect(r).toMatchObject({ id: 'tern-weigh-in', title: 'Weekly weigh-in', weekday: 1 });
  });

  it('daily has no weekday, so it repeats every day at the same time', () => {
    const c = config({ weighIn: true });
    c.weighIn.at = 7 * 60 + 30;
    const [r] = planReminders(c, { weighInFrequency: 'daily' });
    expect(r).toMatchObject({ title: 'Daily weigh-in', hour: 7, minute: 30 });
    expect(r.weekday).toBeUndefined();
  });

  it('reads as "Every day" in Settings when daily', () => {
    expect(describeReminders(DEFAULT_REMINDERS, 'daily').weighIn).toBe('Every day, 8:00 am');
    expect(describeReminders(DEFAULT_REMINDERS, 'weekly').weighIn).toBe('Sundays, 8:00 am');
  });
});

describe('medication reminders', () => {
  const base = { frequency: 'daily', weekday: 1 } as const;
  const meds = [
    { ...base, id: 'a', name: 'Vitamin D', at: 9 * 60, remind: true },
    { ...base, id: 'b', name: 'Iron', at: 20 * 60, remind: false },
    { ...base, id: 'c', name: 'Allergy pill', at: 21 * 60 + 15, remind: true },
  ];

  it('plans a daily reminder for each medication that has one, at its time', () => {
    const plan = planReminders(config(), { medications: meds });
    expect(plan.map((r) => [r.id, r.hour, r.minute, r.weekday])).toEqual([
      [medicationReminderId('a'), 9, 0, undefined],
      [medicationReminderId('c'), 21, 15, undefined],
    ]);
    expect(plan[0].body).toContain('Vitamin D');
  });

  it('a weekly medication is reminded on its weekday only', () => {
    const weekly = { ...base, id: 'w', name: 'Injection', at: 10 * 60, remind: true, frequency: 'weekly', weekday: 4 } as const;
    const [r] = planReminders(config(), { medications: [weekly] });
    expect(r).toMatchObject({ id: medicationReminderId('w'), weekday: 4, hour: 10, minute: 0 });
  });

  it('plans nothing for medications without a reminder', () => {
    expect(planReminders(config(), { medications: [meds[1]] })).toEqual([]);
  });

  it('keeps every id unique next to the other reminders', () => {
    const ids = planReminders(config({ meals: true, weighIn: true }), { medications: meds }).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
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
      water: 'Every 2 hours, 9:00 am to 7:00 pm',
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
    expect(merged.weighIn).toEqual(DEFAULT_REMINDERS.weighIn);
  });

  it('carries over a setting saved under the old weeklyWeighIn key', () => {
    const merged = mergeReminders({ weeklyWeighIn: { on: false, weekday: 4, at: 420 } });
    expect(merged.weighIn).toEqual({ on: false, weekday: 4, at: 420 });
  });

  it('prefers the new weighIn key when both are present', () => {
    const merged = mergeReminders({
      weighIn: { on: true, weekday: 2, at: 600 },
      weeklyWeighIn: { on: false, weekday: 4, at: 420 },
    });
    expect(merged.weighIn).toEqual({ on: true, weekday: 2, at: 600 });
  });

  it('keeps valid saved values and ignores junk', () => {
    const merged = mergeReminders({ mealLog: { midday: 600, evening: 'x' } });
    expect(merged.mealLog.midday).toBe(600);
    expect(merged.mealLog.evening).toBe(DEFAULT_REMINDERS.mealLog.evening);
    expect(mergeReminders(null)).toEqual(DEFAULT_REMINDERS);
  });
});

describe('water reminders', () => {
  const water = (over: Partial<ReminderConfig['water']> = {}): ReminderConfig => ({
    ...config(),
    water: { on: true, start: 9 * 60, end: 19 * 60, everyHours: 2, ...over },
  });

  it('fires from the start time every N hours until the end time', () => {
    expect(waterTimes(water().water)).toEqual([540, 660, 780, 900, 1020, 1140]);
    expect(waterTimes(water({ everyHours: 4 }).water)).toEqual([540, 780, 1020]);
    expect(waterTimes(water({ start: 600, end: 600 }).water)).toEqual([600]);
  });

  it('plans nothing when the end is before the start', () => {
    expect(waterTimes(water({ start: 20 * 60, end: 9 * 60 }).water)).toEqual([]);
  });

  it('is only planned while water is tracked and its reminder is on', () => {
    expect(planReminders(water())).toEqual([]);
    expect(planReminders(water({ on: false }), { trackWater: true })).toEqual([]);
    const plan = planReminders(water(), { trackWater: true });
    expect(plan.map((r) => r.id)).toEqual([0, 1, 2, 3, 4, 5].map(waterReminderId));
    expect(plan.every((r) => r.weekday === undefined && r.key === 'water')).toBe(true);
  });

  it('never plans more reminders than a day can sensibly hold', () => {
    expect(waterTimes(water({ start: 0, end: 23 * 60, everyHours: 1 }).water).length).toBeLessThanOrEqual(12);
  });

  it('is off by default and reads a saved setting back safely', () => {
    expect(DEFAULT_REMINDERS.water.on).toBe(false);
    expect(mergeReminders({ water: { on: true, everyHours: 99, start: 'x' } }).water).toEqual({
      on: true,
      start: 9 * 60,
      end: 19 * 60,
      everyHours: 4,
    });
  });
});
