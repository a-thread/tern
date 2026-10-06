/**
 * The wording of the meal reminders. Each slot has a handful of messages so the
 * same words don't turn up day after day; `variantFor` rotates through them.
 * Gentle and low-pressure: reminders should feel like a small nudge, not a task.
 */
export type ReminderText = { title: string; body: string };

export const LUNCH_MESSAGES: readonly ReminderText[] = [
  { title: 'Lunch', body: 'Whenever you’re ready, log what you had.' },
  { title: 'Lunch time', body: 'Had something to eat? You can add it here.' },
  { title: 'Midday check-in', body: 'What did lunch look like today?' },
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
  { title: 'Evening check-in', body: 'What did dinner look like tonight?' },
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
