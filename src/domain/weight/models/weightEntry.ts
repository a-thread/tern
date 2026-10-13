import { dayKey } from '@shared/utils/date';

/** `loggedAt` is an ISO timestamp; use `formatLoggedAt` to display it. */
export type WeightEntry = { id: string; lb: number; loggedAt: string };

/** Whether a weigh-in falls on today's local calendar date. */
export function isLoggedToday(iso: string, now: Date = new Date()): boolean {
  return dayKey(new Date(iso)) === dayKey(now);
}

/** Whether a weigh-in logged at `iso` falls on the local day `day` (YYYY-MM-DD). */
export function isLoggedOn(iso: string, day: string): boolean {
  return dayKey(new Date(iso)) === day;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today, 7:02 am" · "Yesterday, 7:14 am" · "Thu, 6:58 am" · "Aug 3, 7:00 am" */
export function formatLoggedAt(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const h = d.getHours();
  const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (daysAgo === 0) return `Today, ${time}`;
  if (daysAgo === 1) return `Yesterday, ${time}`;
  if (daysAgo > 1 && daysAgo < 7) return `${WEEKDAYS[d.getDay()]}, ${time}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${time}`;
}

/**
 * A change in weight with its sign: "+1.2", "−1.2", or "0.0" when it rounds to
 * nothing (never "−0.0").
 */
export function signedChange(value: number, digits = 1): string {
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return (0).toFixed(digits);
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(digits)}`;
}