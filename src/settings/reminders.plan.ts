/** Reminder schedules, kept separate for easy reading and testing. */
export type ReminderKey = 'meals' | 'weighIn';

export type PlannedReminder = {
  /** Stable, so re-syncing replaces rather than duplicates. */
  id: string;
  key: ReminderKey;
  title: string;
  body: string;
  hour: number;
  minute: number;
  /** 1 = Sunday … 7 = Saturday. Omitted for a daily reminder. */
  weekday?: number;
};

const ALL: PlannedReminder[] = [
  {
    id: 'tern-meals-midday',
    key: 'meals',
    title: 'Meals',
    body: 'A quick log, if you have a minute.',
    hour: 12,
    minute: 30,
  },
  {
    id: 'tern-meals-evening',
    key: 'meals',
    title: 'Meals',
    body: 'A quick log, if you have a minute.',
    hour: 19,
    minute: 0,
  },
  {
    id: 'tern-weigh-in',
    key: 'weighIn',
    title: 'Weekly weigh-in',
    body: "Your weekly check-in is here, whenever you'd like.",
    weekday: 1,
    hour: 8,
    minute: 0,
  },
];

/** Every id this app ever schedules — all are cancelled on each sync. */
export const ALL_REMINDER_IDS = ALL.map((r) => r.id);

/** How each reminder's schedule reads in Settings. */
export const REMINDER_WHEN: Record<ReminderKey, string> = {
  meals: '12:30 pm and 7:00 pm',
  weighIn: 'Sundays, 8:00 am',
};

/** The reminders to have scheduled, given which are switched on. */
export function planReminders(on: Record<ReminderKey, boolean>): PlannedReminder[] {
  return ALL.filter((r) => on[r.key]);
}
