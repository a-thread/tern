import type { Medication } from '@medication/medications';

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
};

/** How often the person weighs in: it sets the reminder and how often Today asks. */
export type WeighInFrequency = 'daily' | 'weekly';

export const DEFAULT_WEIGH_IN_FREQUENCY: WeighInFrequency = 'weekly';

export const DEFAULT_REMINDERS: ReminderConfig = {
  mealLog: { on: true, midday: 12 * 60 + 30, evening: 19 * 60 },
  weighIn: { on: true, weekday: 1, at: 8 * 60 },
};

export type ReminderKey = 'meals' | 'weighIn';

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
};

/** The fixed reminder ids this app schedules. Medication reminders add `tern-med-<id>`. */
export const ALL_REMINDER_IDS = [
  'tern-meals-midday',
  'tern-meals-evening',
  'tern-weigh-in',
];

export const medicationReminderId = (medicationId: string) => `tern-med-${medicationId}`;

const MEALS_BODY = 'A quick log, if you have a minute.';

const at = (minutes: number) => ({
  hour: Math.floor(minutes / 60),
  minute: minutes % 60,
});

export type PlanExtras = {
  weighInFrequency?: WeighInFrequency;
  medications?: readonly Medication[];
};

/** The reminders to have scheduled for this configuration. */
export function planReminders(
  c: ReminderConfig,
  { weighInFrequency = DEFAULT_WEIGH_IN_FREQUENCY, medications = [] }: PlanExtras = {},
): PlannedReminder[] {
  const plan: PlannedReminder[] = [];
  if (c.mealLog.on) {
    plan.push(
      {
        id: 'tern-meals-midday',
        key: 'meals',
        title: 'Meals',
        body: MEALS_BODY,
        ...at(c.mealLog.midday),
      },
      {
        id: 'tern-meals-evening',
        key: 'meals',
        title: 'Meals',
        body: MEALS_BODY,
        ...at(c.mealLog.evening),
      },
    );
  }
  if (c.weighIn.on) {
    const daily = weighInFrequency === 'daily';
    plan.push({
      id: 'tern-weigh-in',
      key: 'weighIn',
      title: daily ? 'Daily weigh-in' : 'Weekly weigh-in',
      body: daily
        ? 'Your daily check-in is here, whenever you’d like.'
        : 'Your weekly check-in is here, whenever you’d like.',
      ...(daily ? {} : { weekday: c.weighIn.weekday }),
      ...at(c.weighIn.at),
    });
  }
  for (const m of medications) {
    if (!m.remind) continue;
    plan.push({
      id: medicationReminderId(m.id),
      key: 'medication',
      title: 'Medication',
      body: `Time for ${m.name}, whenever you’re ready.`,
      ...at(m.at),
    });
  }
  return plan;
}

export const REMINDER_STEP_MINUTES = 15;

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
  weighInFrequency: WeighInFrequency = DEFAULT_WEIGH_IN_FREQUENCY,
): Record<ReminderKey, string> {
  return {
    meals: `${formatMinutes(c.mealLog.midday)} and ${formatMinutes(c.mealLog.evening)}`,
    weighIn:
      weighInFrequency === 'daily'
        ? `Every day, ${formatMinutes(c.weighIn.at)}`
        : `${weekdayPlural(c.weighIn.weekday)}, ${formatMinutes(c.weighIn.at)}`,
  };
}

/** Saved reminder settings merged over the defaults; older saves (a text `time`, or the `weeklyWeighIn` key) still work. */
export function mergeReminders(saved: unknown): ReminderConfig {
  const s = (saved ?? {}) as {
    mealLog?: Partial<ReminderConfig['mealLog']>;
    weighIn?: Partial<ReminderConfig['weighIn']>;
    weeklyWeighIn?: Partial<ReminderConfig['weighIn']>;
  };
  const weigh = s.weighIn ?? s.weeklyWeighIn;
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  const bool = (v: unknown, fallback: boolean) =>
    typeof v === 'boolean' ? v : fallback;
  const d = DEFAULT_REMINDERS;
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
  };
}
