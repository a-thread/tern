import { type Medication } from './medication';
import { Frequency } from '@shared/models/frequency';
import {
  DINNER_MESSAGES,
  LUNCH_MESSAGES,
  type ReminderText,
} from './mealMessages';

/**
 * What gets scheduled for each reminder. Kept separate from the notification
 * calls so the schedule is easy to read and test. Times are minutes since
 * local midnight; weekdays are 1 = Sunday … 7 = Saturday (the notification
 * API's numbering).
 */
export type ReminderConfig = {
  mealLog: { on: boolean; midday: number; evening: number };
  /** `weekday` only matters when weighing in weekly. */
  weighIn: { on: boolean; weekday: number; at: number };
  /** Drink-water nudges every `everyHours` from `start` to `end` (minutes since midnight). */
  water: { on: boolean; start: number; end: number; everyHours: number };
  /** A daily nudge to check in on mood and stress. */
  mood: { on: boolean; at: number };
  /** Heads-up notifications when a streak is at risk, and how it turned out. */
  streak: { on: boolean };
};

/** How often the person weighs in: it sets the reminder and how often Today asks. */

/** Defaults and limits for reminders. */
export class Reminders {
  static readonly DEFAULT_WEIGH_IN_FREQUENCY: Frequency = Frequency.Weekly;

  static readonly DEFAULTS: ReminderConfig = {
    mealLog: { on: true, midday: 12 * 60 + 30, evening: 19 * 60 },
    weighIn: { on: true, weekday: 1, at: 8 * 60 },
    water: { on: false, start: 9 * 60, end: 19 * 60, everyHours: 2 },
    mood: { on: false, at: 20 * 60 },
    streak: { on: true },
  };

  static readonly WATER_EVERY_HOURS = { min: 1, max: 4 };

  /** The fixed reminder ids this app schedules. Medication reminders add `tern-med-<id>`. */
  static readonly ALL_IDS = [
    'tern-meals-midday',
    'tern-meals-evening',
    'tern-weigh-in',
    'tern-mood',
  ];

  static readonly STEP_MINUTES = 15;
}

export enum ReminderKey {
  Meals = 'meals',
  WeighIn = 'weighIn',
  Water = 'water',
  Mood = 'mood',
  Streak = 'streak',
}

export type PlannedReminder = {
  /** Stable, so re-syncing replaces rather than duplicates. */
  id: string;
  key: ReminderKey | 'medication';
  title: string;
  body: string;
  hour: number;
  minute: number;
  /** Omitted for a daily reminder. */
  weekday?: number;
  /** Alternate wording; scheduling rotates through these day by day. */
  variants?: readonly ReminderText[];
};

/** What the phone lets Tern keep scheduled. iOS silently drops everything past the 64 soonest. */
export class NotificationLimits {
  static readonly IOS_PENDING = 64;
  /** Room kept for streak alerts, which are scheduled separately. */
  static readonly STREAK_RESERVE = 4;
  /** A repeating reminder that goes quiet for a rest day becomes up to this many triggers. */
  static readonly REST_DAY_TRIGGERS = 7;
}

/**
 * How many days ahead the reminders with rotating wording (the meal ones, one notification per
 * day) can be scheduled without the plan going over `limit` pending notifications. Between one
 * day and `maxDays`; everything else in the plan counts as one notification (or the rest-day
 * set of weekly repeats), and streak alerts get a reserve.
 */
export function rotationDays(
  plan: readonly PlannedReminder[],
  limit: number,
  maxDays: number,
  restToday = false,
): number {
  const rotating = plan.filter((r) => r.variants).length;
  if (rotating === 0) return maxDays;
  const fixed = plan
    .filter((r) => !r.variants)
    .reduce(
      (n, r) =>
        n +
        (restToday && r.key !== 'medication'
          ? NotificationLimits.REST_DAY_TRIGGERS
          : 1),
      0,
    );
  const budget = limit - NotificationLimits.STREAK_RESERVE - fixed;
  return Math.max(1, Math.min(maxDays, Math.floor(budget / rotating)));
}

export const medicationReminderId = (medicationId: string) =>
  `tern-med-${medicationId}`;

const at = (minutes: number) => ({
  hour: Math.floor(minutes / 60),
  minute: minutes % 60,
});

export type PlanExtras = {
  weighInFrequency?: Frequency;
  medications?: readonly Medication[];
  /** Water reminders only make sense while water tracking is on. */
  trackWater?: boolean;
  /** The check-in reminder only makes sense while mood tracking is on. */
  trackMood?: boolean;
  /** The weigh-in reminder only makes sense while weight tracking is on. */
  trackWeight?: boolean;
};

export const waterReminderId = (index: number) => `tern-water-${index}`;

/** The times of day (minutes) a water reminder fires: start, then every N hours until end. */
export function waterTimes(w: ReminderConfig['water']): number[] {
  const step = Math.max(1, Math.round(w.everyHours)) * 60;
  const times: number[] = [];
  for (let t = w.start; t <= w.end && times.length < 12; t += step)
    times.push(t);
  return times;
}

/** The reminders to have scheduled for this configuration. */
export function planReminders(
  c: ReminderConfig,
  {
    weighInFrequency = Reminders.DEFAULT_WEIGH_IN_FREQUENCY,
    medications = [],
    trackWater = false,
    trackMood = false,
    trackWeight = true,
  }: PlanExtras = {},
): PlannedReminder[] {
  const plan: PlannedReminder[] = [];
  if (c.mealLog.on) {
    plan.push(
      {
        id: 'tern-meals-midday',
        key: ReminderKey.Meals,
        title: LUNCH_MESSAGES[0].title,
        body: LUNCH_MESSAGES[0].body,
        variants: LUNCH_MESSAGES,
        ...at(c.mealLog.midday),
      },
      {
        id: 'tern-meals-evening',
        key: ReminderKey.Meals,
        title: DINNER_MESSAGES[0].title,
        body: DINNER_MESSAGES[0].body,
        variants: DINNER_MESSAGES,
        ...at(c.mealLog.evening),
      },
    );
  }
  if (trackWeight && c.weighIn.on) {
    const daily = weighInFrequency === Frequency.Daily;
    plan.push({
      id: 'tern-weigh-in',
      key: ReminderKey.WeighIn,
      title: daily ? 'Daily weigh-in' : 'Weekly weigh-in',
      body: daily
        ? 'Your daily check-in is here, whenever you’d like.'
        : 'Your weekly check-in is here, whenever you’d like.',
      ...(daily ? {} : { weekday: c.weighIn.weekday }),
      ...at(c.weighIn.at),
    });
  }
  if (trackWater && c.water.on) {
    waterTimes(c.water).forEach((t, i) => {
      plan.push({
        id: waterReminderId(i),
        key: ReminderKey.Water,
        title: 'Water',
        body: 'A glass of water, if you feel like one.',
        ...at(t),
      });
    });
  }
  if (trackMood && c.mood.on) {
    plan.push({
      id: 'tern-mood',
      key: ReminderKey.Mood,
      title: 'Check-in',
      body: 'How are you feeling today? A quick check-in, if you like.',
      ...at(c.mood.at),
    });
  }
  for (const m of medications) {
    if (!m.remind) continue;
    plan.push({
      id: medicationReminderId(m.id),
      key: 'medication',
      title: 'Medication',
      body: `Time for ${m.name}, whenever you’re ready.`,
      ...(m.frequency === Frequency.Weekly ? { weekday: m.weekday } : {}),
      ...at(m.at),
    });
  }
  return plan;
}

/** Moves a time of day by `deltaMinutes`, wrapping around midnight. */
export function stepMinutes(minutes: number, deltaMinutes: number): number {
  return (((minutes + deltaMinutes) % 1440) + 1440) % 1440;
}

/** Moves a weekday (1–7) by `delta` days, wrapping. */
export function stepWeekday(weekday: number, delta: number): number {
  return ((((weekday - 1 + delta) % 7) + 7) % 7) + 1;
}

/** "12:30 pm" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

const WEEKDAYS_PLURAL = [
  'Sundays',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
];
export const weekdayPlural = (weekday: number) => WEEKDAYS_PLURAL[weekday - 1];

/** How each reminder's schedule reads in Settings. */
export function describeReminders(
  c: ReminderConfig,
  weighInFrequency: Frequency = Reminders.DEFAULT_WEIGH_IN_FREQUENCY,
): Record<ReminderKey, string> {
  return {
    meals: `${formatMinutes(c.mealLog.midday)} and ${formatMinutes(c.mealLog.evening)}`,
    weighIn:
      weighInFrequency === Frequency.Daily
        ? `Every day, ${formatMinutes(c.weighIn.at)}`
        : `${weekdayPlural(c.weighIn.weekday)}, ${formatMinutes(c.weighIn.at)}`,
    mood: `Every day, ${formatMinutes(c.mood.at)}`,
    streak: 'An evening heads-up when a streak is waiting on today’s steps',
    water: `Every ${c.water.everyHours === 1 ? 'hour' : `${c.water.everyHours} hours`}, ${formatMinutes(c.water.start)} to ${formatMinutes(c.water.end)}`,
  };
}

/** Saved reminder settings merged over the defaults; older saves (a text `time`, or the `weeklyWeighIn` key) still work. */
export function mergeReminders(saved: unknown): ReminderConfig {
  const s = (saved ?? {}) as {
    mealLog?: Partial<ReminderConfig['mealLog']>;
    weighIn?: Partial<ReminderConfig['weighIn']>;
    weeklyWeighIn?: Partial<ReminderConfig['weighIn']>;
    water?: Partial<ReminderConfig['water']>;
    mood?: Partial<ReminderConfig['mood']>;
    streak?: Partial<ReminderConfig['streak']>;
  };
  const weigh = s.weighIn ?? s.weeklyWeighIn;
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  const bool = (v: unknown, fallback: boolean) =>
    typeof v === 'boolean' ? v : fallback;
  const d = Reminders.DEFAULTS;
  return {
    mealLog: {
      on: bool(s.mealLog?.on, d.mealLog.on),
      midday: num(s.mealLog?.midday, d.mealLog.midday),
      evening: num(s.mealLog?.evening, d.mealLog.evening),
    },
    weighIn: {
      on: bool(weigh?.on, d.weighIn.on),
      weekday: num(weigh?.weekday, d.weighIn.weekday),
      at: num(weigh?.at, d.weighIn.at),
    },
    water: {
      on: bool(s.water?.on, d.water.on),
      start: num(s.water?.start, d.water.start),
      end: num(s.water?.end, d.water.end),
      everyHours: Math.min(
        Math.max(
          Math.round(num(s.water?.everyHours, d.water.everyHours)),
          Reminders.WATER_EVERY_HOURS.min,
        ),
        Reminders.WATER_EVERY_HOURS.max,
      ),
    },
    mood: {
      on: bool(s.mood?.on, d.mood.on),
      at: num(s.mood?.at, d.mood.at),
    },
    streak: { on: bool(s.streak?.on, d.streak.on) },
  };
}

/**
 * The one-off times `r` fires over the next `days` days from `now` (today included, if its time
 * hasn't passed), left out for today when `skipToday`: how a rest day goes quiet for a reminder
 * that would otherwise repeat on its own. A weekly reminder only falls on its weekday.
 */
export function upcomingDates(
  r: Pick<PlannedReminder, 'hour' | 'minute' | 'weekday'>,
  now: Date,
  days: number,
  skipToday = false,
): Date[] {
  const out: Date[] = [];
  for (let i = skipToday ? 1 : 0; i < days; i++) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + i,
      r.hour,
      r.minute,
    );
    if (date <= now) continue;
    // Weekdays here run 1 = Sunday … 7 = Saturday, like the settings.
    if (r.weekday && date.getDay() + 1 !== r.weekday) continue;
    out.push(date);
  }
  return out;
}

/** A replacement trigger for a reminder on a rest day: a weekly repeat, or a single date. */
export type RestTrigger =
  | { id: string; weekday: number }
  | { id: string; date: Date };

/**
 * How a reminder that repeats by itself goes quiet for the rest of today, when a repeating
 * trigger can't skip a day: every other weekday keeps a weekly repeat, and today's weekday is a
 * single date a week from now. Only that one weekday needs the next sync to repeat again, so a
 * missed sync costs at most one day a week, not every day. Empty when today's time has passed,
 * or a weekly reminder isn't due today: the usual trigger is already right.
 */
export function restDayTriggers(
  r: Pick<PlannedReminder, 'id' | 'hour' | 'minute' | 'weekday'>,
  now: Date,
): RestTrigger[] {
  if (!upcomingDates(r, now, 1).length) return [];
  const today = now.getDay() + 1;
  const nextWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 7,
    r.hour,
    r.minute,
  );
  const out: RestTrigger[] = [{ id: `${r.id}-rest-${today}`, date: nextWeek }];
  if (!r.weekday) {
    for (let weekday = 1; weekday <= 7; weekday++) {
      if (weekday !== today)
        out.push({ id: `${r.id}-rest-${weekday}`, weekday });
    }
  }
  return out;
}
