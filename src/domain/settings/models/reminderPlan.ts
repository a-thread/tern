import { type Medication } from './medication';
import { Frequency } from '@shared/models/frequency';
import {
  DINNER_MESSAGES,
  LUNCH_MESSAGES,
  type ReminderText,
} from './mealMessages';

/** Reminder schedule; times are minutes since midnight, weekdays 1–7 (Sunday–Saturday). */
export type ReminderConfig = {
  mealLog: { on: boolean; midday: number; evening: number };
  /** Used for weekly weigh-ins. */
  weighIn: { on: boolean; weekday: number; at: number };
  /** Water reminders from `start` to `end` at `everyHours` intervals. */
  water: { on: boolean; start: number; end: number; everyHours: number };
  /** Daily mood check-in. */
  mood: { on: boolean; at: number };
  /** Streak status notifications. */
  streak: { on: boolean };
};

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

  /** Fixed ids; medication reminders use `tern-med-<id>`. */
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
  /** Stable id used to replace reminders on re-sync. */
  id: string;
  key: ReminderKey | 'medication';
  title: string;
  body: string;
  hour: number;
  minute: number;
  /** Omitted for a daily reminder. */
  weekday?: number;
  /** Wording rotated each day. */
  variants?: readonly ReminderText[];
};

/** Pending notification limits. iOS keeps only the 64 soonest. */
export class NotificationLimits {
  static readonly IOS_PENDING = 64;
  /** Reserved for separately scheduled streak alerts. */
  static readonly STREAK_RESERVE = 4;
  /** Triggers needed to silence a repeating reminder for a rest day. */
  static readonly REST_DAY_TRIGGERS = 7;
}

/** Items completed today; related reminders stay quiet until tomorrow. */
export type DoneToday = {
  /** Rest day; medication reminders still fire. */
  rest: boolean;
  /** Core meals logged or marked "nothing today". */
  meals: boolean;
  /** Weighed in, or the weigh-in skipped. */
  weighIn: boolean;
  /** The water goal is reached. */
  water: boolean;
  /** Today's check-in is done. */
  mood: boolean;
  /** Ids of the medications taken today. */
  medications: readonly string[];
};

export const NOTHING_DONE: DoneToday = {
  rest: false,
  meals: false,
  weighIn: false,
  water: false,
  mood: false,
  medications: [],
};

/** Whether `r` should stay quiet today. */
export function isQuietToday(
  r: Pick<PlannedReminder, 'id' | 'key'>,
  done: DoneToday,
): boolean {
  // Each medication reminder represents a dose, so only taking it quiets it.
  if (r.key === 'medication') {
    return done.medications.some((id) => medicationReminderId(id) === r.id);
  }
  if (done.rest) return true;
  switch (r.key) {
    case ReminderKey.Meals:
      return done.meals;
    case ReminderKey.WeighIn:
      return done.weighIn;
    case ReminderKey.Water:
      return done.water;
    case ReminderKey.Mood:
      return done.mood;
    default:
      return false;
  }
}

/** Maximum rotation schedule length within the notification limit and streak reserve. */
export function rotationDays(
  plan: readonly PlannedReminder[],
  limit: number,
  maxDays: number,
  quiet?: (r: PlannedReminder) => boolean,
): number {
  const rotating = plan.filter((r) => r.variants).length;
  if (rotating === 0) return maxDays;
  const fixed = plan
    .filter((r) => !r.variants)
    .reduce(
      (n, r) => n + (quiet?.(r) ? NotificationLimits.REST_DAY_TRIGGERS : 1),
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
  /** Enable water reminders only when tracking water. */
  trackWater?: boolean;
  /** Enable mood reminders only when tracking mood. */
  trackMood?: boolean;
  /** Enable weigh-in reminders only when tracking weight. */
  trackWeight?: boolean;
  /** Enable meal reminders only when tracking food. */
  trackFood?: boolean;
};

/** Every reminder switched off, keeping the times chosen for each. */
export function remindersOff(c: ReminderConfig): ReminderConfig {
  return {
    mealLog: { ...c.mealLog, on: false },
    weighIn: { ...c.weighIn, on: false },
    water: { ...c.water, on: false },
    mood: { ...c.mood, on: false },
    streak: { ...c.streak, on: false },
  };
}

/** Each kind of reminder, and whether it will actually fire. */
export type RemindersOn = {
  meals: boolean;
  weighIn: boolean;
  water: boolean;
  mood: boolean;
  streak: boolean;
  medication: boolean;
};

/**
 * The reminders that will actually fire: switched on, and for something tracked (a water
 * reminder does nothing while water is off). Streak alerts need steps read from the health
 * app; medication reminders are set on each medication.
 */
export function remindersOn(
  c: ReminderConfig,
  {
    medications = [],
    trackWater = false,
    trackMood = false,
    trackWeight = true,
    trackFood = true,
    readSteps = true,
  }: PlanExtras & { readSteps?: boolean } = {},
): RemindersOn {
  return {
    meals: trackFood && c.mealLog.on,
    weighIn: trackWeight && c.weighIn.on,
    water: trackWater && c.water.on,
    mood: trackMood && c.mood.on,
    streak: readSteps && c.streak.on,
    medication: medications.some((m) => m.remind),
  };
}

export const waterReminderId = (index: number) => `tern-water-${index}`;

/** Water reminder times in minutes, from start through end. */
export function waterTimes(w: ReminderConfig['water']): number[] {
  const step = Math.max(1, Math.round(w.everyHours)) * 60;
  const times: number[] = [];
  for (let t = w.start; t <= w.end && times.length < 12; t += step)
    times.push(t);
  return times;
}

/** Build reminders for this configuration. */
export function planReminders(
  c: ReminderConfig,
  {
    weighInFrequency = Reminders.DEFAULT_WEIGH_IN_FREQUENCY,
    medications = [],
    trackWater = false,
    trackMood = false,
    trackWeight = true,
    trackFood = true,
  }: PlanExtras = {},
): PlannedReminder[] {
  const plan: PlannedReminder[] = [];
  if (trackFood && c.mealLog.on) {
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
        ? 'Today’s weigh-in, whenever you’d like.'
        : 'This week’s weigh-in, whenever you’d like.',
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
      title: 'Mood check-in',
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

/** Shift a time by `deltaMinutes`, wrapping at midnight. */
export function stepMinutes(minutes: number, deltaMinutes: number): number {
  return (((minutes + deltaMinutes) % 1440) + 1440) % 1440;
}

/** Shift a weekday (1–7), wrapping around the week. */
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

/** Format reminder schedules for Settings. */
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
    streak:
      'An evening nudge if today’s goal isn’t met yet, and a morning note when a freeze was used',
    water: `Every ${c.water.everyHours === 1 ? 'hour' : `${c.water.everyHours} hours`}, ${formatMinutes(c.water.start)} to ${formatMinutes(c.water.end)}`,
  };
}

/** Merge saved settings with defaults, supporting legacy keys. */
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

/** Upcoming reminder times, optionally skipping today; weekly reminders use their weekday. */
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
    // Match settings: 1 = Sunday through 7 = Saturday.
    if (r.weekday && date.getDay() + 1 !== r.weekday) continue;
    out.push(date);
  }
  return out;
}

/** Replacement trigger used to silence a reminder on a rest day. */
export type RestTrigger =
  { id: string; weekday: number } | { id: string; date: Date };

/** Replacement triggers that silence a repeating reminder for the rest of a rest day. */
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
