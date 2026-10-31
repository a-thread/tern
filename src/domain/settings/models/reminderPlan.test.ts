import {
  isQuietToday,
  NOTHING_DONE,
  rotationDays,
  NotificationLimits,
  type PlannedReminder,
  restDayTriggers,
  upcomingDates,
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
  Reminders,
  ReminderKey,
} from './reminderPlan';
import { Frequency } from '@shared/models/frequency';

const config = (
  over: Partial<{ meals: boolean; weighIn: boolean }> = {},
): ReminderConfig => ({
  mealLog: { ...Reminders.DEFAULTS.mealLog, on: over.meals ?? false },
  weighIn: {
    ...Reminders.DEFAULTS.weighIn,
    on: over.weighIn ?? false,
  },
  water: { ...Reminders.DEFAULTS.water, on: false },
  mood: { ...Reminders.DEFAULTS.mood, on: false },
  streak: { on: false },
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

  it('schedules no meal reminders while food is not tracked', () => {
    expect(
      planReminders(config({ meals: true }), { trackFood: false }),
    ).toEqual([]);
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
    ids.forEach((id) => expect(Reminders.ALL_IDS).toContain(id));
  });

  it('never mentions weight loss, calories or streaks', () => {
    const text = planReminders(config({ meals: true, weighIn: true }), {
      weighInFrequency: Frequency.Daily,
    })
      .map((r) => `${r.title} ${r.body}`)
      .join(' ')
      .toLowerCase();
    expect(text).not.toMatch(/streak|calorie|lose|loss|goal|behind|miss/);
  });
});

describe('weigh-in frequency', () => {
  it('is weekly by default, on the chosen weekday', () => {
    const [r] = planReminders(config({ weighIn: true }));
    expect(r).toMatchObject({
      id: 'tern-weigh-in',
      title: 'Weekly weigh-in',
      weekday: 1,
    });
  });

  it('daily has no weekday, so it repeats every day at the same time', () => {
    const c = config({ weighIn: true });
    c.weighIn.at = 7 * 60 + 30;
    const [r] = planReminders(c, { weighInFrequency: Frequency.Daily });
    expect(r).toMatchObject({ title: 'Daily weigh-in', hour: 7, minute: 30 });
    expect(r.weekday).toBeUndefined();
  });

  it('reads as "Every day" in Settings when daily', () => {
    expect(describeReminders(Reminders.DEFAULTS, Frequency.Daily).weighIn).toBe(
      'Every day, 8:00 am',
    );
    expect(
      describeReminders(Reminders.DEFAULTS, Frequency.Weekly).weighIn,
    ).toBe('Sundays, 8:00 am');
  });
});

describe('medication reminders', () => {
  const base = { frequency: Frequency.Daily, weekday: 1 } as const;
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
    const weekly = {
      ...base,
      id: 'w',
      name: 'Injection',
      at: 10 * 60,
      remind: true,
      frequency: Frequency.Weekly,
      weekday: 4,
    } as const;
    const [r] = planReminders(config(), { medications: [weekly] });
    expect(r).toMatchObject({
      id: medicationReminderId('w'),
      weekday: 4,
      hour: 10,
      minute: 0,
    });
  });

  it('plans nothing for medications without a reminder', () => {
    expect(planReminders(config(), { medications: [meds[1]] })).toEqual([]);
  });

  it('keeps every id unique next to the other reminders', () => {
    const ids = planReminders(config({ meals: true, weighIn: true }), {
      medications: meds,
    }).map((r) => r.id);
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
    expect(describeReminders(Reminders.DEFAULTS)).toEqual({
      meals: '12:30 pm and 7:00 pm',
      weighIn: 'Sundays, 8:00 am',
      water: 'Every 2 hours, 9:00 am to 7:00 pm',
      streak:
        'An evening nudge if today’s goal isn’t met yet, and a morning note when a freeze was used',
      mood: 'Every day, 8:00 pm',
    });
  });
});

describe('mergeReminders', () => {
  it('fills in defaults for an older save that only had text times', () => {
    const merged = mergeReminders({
      mealLog: { on: false, time: '12:30 pm, 7:00 pm' },
      weeklyWeighIn: { on: true, time: 'Sundays, 8:00 am' },
    });
    expect(merged.mealLog).toEqual({
      ...Reminders.DEFAULTS.mealLog,
      on: false,
    });
    expect(merged.weighIn).toEqual(Reminders.DEFAULTS.weighIn);
  });

  it('carries over a setting saved under the old weeklyWeighIn key', () => {
    const merged = mergeReminders({
      weeklyWeighIn: { on: false, weekday: 4, at: 420 },
    });
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
    expect(merged.mealLog.evening).toBe(Reminders.DEFAULTS.mealLog.evening);
    expect(mergeReminders(null)).toEqual(Reminders.DEFAULTS);
  });
});

describe('water reminders', () => {
  const water = (
    over: Partial<ReminderConfig['water']> = {},
  ): ReminderConfig => ({
    ...config(),
    water: { on: true, start: 9 * 60, end: 19 * 60, everyHours: 2, ...over },
  });

  it('fires from the start time every N hours until the end time', () => {
    expect(waterTimes(water().water)).toEqual([540, 660, 780, 900, 1020, 1140]);
    expect(waterTimes(water({ everyHours: 4 }).water)).toEqual([
      540, 780, 1020,
    ]);
    expect(waterTimes(water({ start: 600, end: 600 }).water)).toEqual([600]);
  });

  it('plans nothing when the end is before the start', () => {
    expect(waterTimes(water({ start: 20 * 60, end: 9 * 60 }).water)).toEqual(
      [],
    );
  });

  it('is only planned while water is tracked and its reminder is on', () => {
    expect(planReminders(water())).toEqual([]);
    expect(planReminders(water({ on: false }), { trackWater: true })).toEqual(
      [],
    );
    const plan = planReminders(water(), { trackWater: true });
    expect(plan.map((r) => r.id)).toEqual(
      [0, 1, 2, 3, 4, 5].map(waterReminderId),
    );
    expect(
      plan.every((r) => r.weekday === undefined && r.key === ReminderKey.Water),
    ).toBe(true);
  });

  it('never plans more reminders than a day can sensibly hold', () => {
    expect(
      waterTimes(water({ start: 0, end: 23 * 60, everyHours: 1 }).water).length,
    ).toBeLessThanOrEqual(12);
  });

  it('is off by default and reads a saved setting back safely', () => {
    expect(Reminders.DEFAULTS.water.on).toBe(false);
    expect(
      mergeReminders({ water: { on: true, everyHours: 99, start: 'x' } }).water,
    ).toEqual({
      on: true,
      start: 9 * 60,
      end: 19 * 60,
      everyHours: 4,
    });
  });
});

describe('check-in reminder', () => {
  const mood = (
    over: Partial<ReminderConfig['mood']> = {},
  ): ReminderConfig => ({
    ...config(),
    mood: { on: true, at: 20 * 60 + 30, ...over },
  });

  it('is off by default, at 8:00 pm', () => {
    expect(Reminders.DEFAULTS.mood).toEqual({ on: false, at: 20 * 60 });
  });

  it('is only planned while mood tracking is on and its reminder is on', () => {
    expect(planReminders(mood())).toEqual([]);
    expect(planReminders(mood({ on: false }), { trackMood: true })).toEqual([]);
    const [r] = planReminders(mood(), { trackMood: true });
    expect(r).toMatchObject({
      id: 'tern-mood',
      key: 'mood',
      hour: 20,
      minute: 30,
    });
    expect(r.weekday).toBeUndefined();
    expect(Reminders.ALL_IDS).toContain(r.id);
  });

  it('is gentle: no scores, streaks or goals in the text', () => {
    const [r] = planReminders(mood(), { trackMood: true });
    expect(`${r.title} ${r.body}`.toLowerCase()).not.toMatch(
      /streak|score|goal|behind|miss|stress/,
    );
  });

  it('reads a saved setting back safely', () => {
    expect(mergeReminders({ mood: { on: true, at: 'x' } }).mood).toEqual({
      on: true,
      at: 20 * 60,
    });
    expect(mergeReminders({ mood: { at: 540 } }).mood).toEqual({
      on: false,
      at: 540,
    });
  });
});

describe('upcomingDates', () => {
  // Saturday 10 October 2026, 10:00. Weekdays run 1 = Sunday … 7 = Saturday.
  const now = new Date(2026, 9, 10, 10, 0);

  it('lists a daily reminder from today (if its time is still to come) for the days asked', () => {
    const dates = upcomingDates({ hour: 12, minute: 30 }, now, 3);
    expect(
      dates.map((d) => [d.getDate(), d.getHours(), d.getMinutes()]),
    ).toEqual([
      [10, 12, 30],
      [11, 12, 30],
      [12, 12, 30],
    ]);
  });

  it('starts tomorrow once its time has passed today', () => {
    expect(
      upcomingDates({ hour: 8, minute: 0 }, now, 2).map((d) => d.getDate()),
    ).toEqual([11]);
  });

  it('leaves today out on a rest day, even with its time still to come', () => {
    expect(
      upcomingDates({ hour: 12, minute: 30 }, now, 3, true).map((d) =>
        d.getDate(),
      ),
    ).toEqual([11, 12]);
  });

  it('only falls on the weekday for a weekly reminder', () => {
    const sundays = upcomingDates({ hour: 8, minute: 0, weekday: 1 }, now, 14);
    expect(sundays.map((d) => d.getDay())).toEqual([0, 0]);
    expect(sundays.map((d) => d.getDate())).toEqual([11, 18]);
    // A weekly reminder for today (Saturday), on a rest day, skips today and comes next week.
    const saturdays = upcomingDates(
      { hour: 18, minute: 0, weekday: 7 },
      now,
      14,
      true,
    );
    expect(saturdays.map((d) => d.getDate())).toEqual([17]);
  });
});

describe('restDayTriggers', () => {
  // Saturday 10 October 2026, 10:00 (weekday 7).
  const now = new Date(2026, 9, 10, 10, 0);

  it("keeps a weekly repeat for six weekdays and dates today's a week out", () => {
    const t = restDayTriggers({ id: 'x', hour: 12, minute: 30 }, now);
    expect(t).toHaveLength(7);
    const dated = t.filter((x) => 'date' in x);
    expect(dated).toHaveLength(1);
    expect((dated[0] as { date: Date }).date).toEqual(
      new Date(2026, 9, 17, 12, 30),
    );
    const weekdays = t
      .filter((x) => 'weekday' in x)
      .map((x) => (x as { weekday: number }).weekday);
    expect(weekdays.sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("is empty once today's time has passed, or a weekly reminder is not due today", () => {
    expect(restDayTriggers({ id: 'x', hour: 8, minute: 0 }, now)).toEqual([]);
    expect(
      restDayTriggers({ id: 'x', hour: 12, minute: 0, weekday: 1 }, now),
    ).toEqual([]);
  });

  it("is just next week's date for a weekly reminder due today", () => {
    const t = restDayTriggers(
      { id: 'x', hour: 18, minute: 0, weekday: 7 },
      now,
    );
    expect(t).toEqual([{ id: 'x-rest-7', date: new Date(2026, 9, 17, 18, 0) }]);
  });
});

describe('rotationDays', () => {
  const rotating = (id: string): PlannedReminder => ({
    id,
    key: ReminderKey.Meals,
    title: 't',
    body: 'b',
    hour: 12,
    minute: 0,
    variants: [{ title: 't', body: 'b' }],
  });
  const fixed = (
    id: string,
    key: PlannedReminder['key'] = ReminderKey.Water,
  ): PlannedReminder => ({
    id,
    key,
    title: 't',
    body: 'b',
    hour: 9,
    minute: 0,
  });

  it('keeps the full rotation when there is no limit', () => {
    expect(rotationDays([rotating('a'), rotating('b')], Infinity, 14)).toBe(14);
  });

  it('keeps the full rotation when it fits under the iOS limit', () => {
    const plan = [rotating('a'), rotating('b'), fixed('w1'), fixed('w2')];
    expect(rotationDays(plan, NotificationLimits.IOS_PENDING, 14)).toBe(14);
  });

  it('shortens the rotation when a lot of other reminders are scheduled', () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      fixed(`med-${i}`, 'medication'),
    );
    const days = rotationDays(
      [rotating('a'), rotating('b'), ...many],
      NotificationLimits.IOS_PENDING,
      14,
    );
    expect(days).toBeLessThan(14);
    expect(
      days * 2 + 40 + NotificationLimits.STREAK_RESERVE,
    ).toBeLessThanOrEqual(NotificationLimits.IOS_PENDING);
  });

  it('counts a rest day as a week of triggers for each repeating reminder', () => {
    const plan = [
      rotating('a'),
      rotating('b'),
      ...Array.from({ length: 6 }, (_, i) => fixed(`w${i}`)),
    ];
    const normal = rotationDays(plan, NotificationLimits.IOS_PENDING, 14);
    const rest = rotationDays(
      plan,
      NotificationLimits.IOS_PENDING,
      14,
      () => true,
    );
    expect(rest).toBeLessThan(normal);
  });

  it('never goes below one day', () => {
    const many = Array.from({ length: 80 }, (_, i) =>
      fixed(`m${i}`, 'medication'),
    );
    expect(
      rotationDays(
        [rotating('a'), ...many],
        NotificationLimits.IOS_PENDING,
        14,
      ),
    ).toBe(1);
  });
});

describe('isQuietToday', () => {
  const meals = { id: 'tern-meals-midday', key: ReminderKey.Meals };
  const weighIn = { id: 'tern-weigh-in', key: ReminderKey.WeighIn };
  const water = { id: 'tern-water-0', key: ReminderKey.Water };
  const mood = { id: 'tern-mood', key: ReminderKey.Mood };
  const dose = (id: string) => ({
    id: medicationReminderId(id),
    key: 'medication' as const,
  });

  it('is never quiet when nothing is done', () => {
    for (const r of [meals, weighIn, water, mood, dose('a')]) {
      expect(isQuietToday(r, NOTHING_DONE)).toBe(false);
    }
  });

  it('quietens each reminder only for its own goal', () => {
    expect(isQuietToday(meals, { ...NOTHING_DONE, meals: true })).toBe(true);
    expect(isQuietToday(weighIn, { ...NOTHING_DONE, meals: true })).toBe(false);
    expect(isQuietToday(weighIn, { ...NOTHING_DONE, weighIn: true })).toBe(
      true,
    );
    expect(isQuietToday(water, { ...NOTHING_DONE, water: true })).toBe(true);
    expect(isQuietToday(mood, { ...NOTHING_DONE, mood: true })).toBe(true);
    expect(isQuietToday(mood, { ...NOTHING_DONE, water: true })).toBe(false);
  });

  it('quietens a dose only when that medication was taken', () => {
    const done = { ...NOTHING_DONE, medications: ['a'] };
    expect(isQuietToday(dose('a'), done)).toBe(true);
    expect(isQuietToday(dose('b'), done)).toBe(false);
  });

  it('quietens everything but medication on a rest day', () => {
    const rest = { ...NOTHING_DONE, rest: true };
    for (const r of [meals, weighIn, water, mood])
      expect(isQuietToday(r, rest)).toBe(true);
    expect(isQuietToday(dose('a'), rest)).toBe(false);
  });
});
