/**
 * The wording of the meal reminders. Each slot has a handful of messages so the
 * same words don't turn up day after day; `variantFor` rotates through them.
 * Gentle and low-pressure: reminders should feel like a small nudge, not a task.
 */
export type ReminderText = { title: string; body: string };

export const LUNCH_MESSAGES: readonly ReminderText[] = [
  { title: 'Lunch', body: 'Whenever you’re ready, log what you had.' },
  { title: 'Lunch time', body: 'Had something to eat? You can add it here.' },
  { title: 'Lunch', body: 'What did lunch look like today?' },
  {
    title: 'Lunch',
    body: 'Take your time. Add lunch whenever it feels right.',
  },
  { title: 'Midday', body: 'A little note about lunch, if you’d like.' },
  { title: 'Lunch break', body: 'Enjoy your lunch. You can add it afterward.' },
  { title: 'Noon-ish', body: 'What’s on the plate today?' },
  { title: 'Lunch', body: 'If you’ve eaten, there’s a spot for it here.' },
];

export const DINNER_MESSAGES: readonly ReminderText[] = [
  { title: 'Dinner', body: 'Whenever you’re ready, add what you had.' },
  { title: 'Dinner time', body: 'Had dinner? You can add it here.' },
  { title: 'Dinner', body: 'What did dinner look like tonight?' },
  { title: 'Dinner', body: 'Enjoy your meal. You can add it afterward.' },
  { title: 'Winding down', body: 'A little note about dinner, if you’d like.' },
  { title: 'Dinner', body: 'No rush. Add it whenever you’re ready.' },
  {
    title: 'This evening',
    body: 'Anything from tonight you’d like to remember?',
  },
  {
    title: 'Supper',
    body: 'Hope dinner was a good one. Add it when you’re ready.',
  },
];

/**
 * Reminders to eat, for someone who doesn't track food. Nothing to log and no "should":
 * a kind word so the day doesn't slip by, and something in the evening so hunger doesn't
 * arrive at bedtime.
 */
export const EAT_MIDDAY_MESSAGES: readonly ReminderText[] = [
  { title: 'Time to eat', body: 'A little something now, if you haven’t yet.' },
  { title: 'Lunch', body: 'Have you had a chance to eat today?' },
  { title: 'Midday', body: 'A good moment for a bite to eat.' },
  { title: 'A gentle nudge', body: 'Something to eat would be good about now.' },
  { title: 'Lunch time', body: 'Take a little break and have something to eat.' },
  { title: 'Midday', body: 'Lunch, whenever you can fit it in.' },
];

export const EAT_EVENING_MESSAGES: readonly ReminderText[] = [
  { title: 'Dinner', body: 'Time for something to eat before the evening winds down.' },
  { title: 'Before bed', body: 'Have you eaten tonight? A little something now helps later.' },
  { title: 'This evening', body: 'A good moment for dinner, if you haven’t had it.' },
  { title: 'A gentle nudge', body: 'Something to eat now, so you’re not hungry at bedtime.' },
  { title: 'Supper', body: 'Dinner, or even a snack, before the night gets late.' },
  { title: 'Evening', body: 'Have something to eat while there’s still time.' },
];

/** Which message to use on a given day. Consecutive days always differ. */
export function variantFor<T>(variants: readonly T[], dayNumber: number): T {
  const n = variants.length;
  return variants[((dayNumber % n) + n) % n];
}

/** Whole days since 1970 for a local date (DST-safe), used to rotate messages. */
export function dayNumber(d: Date): number {
  return Math.floor(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000,
  );
}
