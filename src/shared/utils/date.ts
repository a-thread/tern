/** Local calendar date as YYYY-MM-DD — the "day" a log entry or award belongs to. */
export function dayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** The local-midnight Date for a YYYY-MM-DD key. */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** `key` moved by `n` calendar days (DST-safe: works on the date, not on 24h blocks). */
export function addDays(key: string, n: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** The Monday of the week containing `key` (weeks run Monday to Sunday). */
export function weekStartKey(key: string): string {
  const d = parseDayKey(key);
  return addDays(key, -((d.getDay() + 6) % 7));
}

/** Milliseconds until the next local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const weekdayName = (key: string) => WEEKDAYS[parseDayKey(key).getDay()];
export const weekdayLetter = (key: string) => weekdayName(key)[0];

/** "Saturday, Sep 13" */
export function formatLongDate(key: string): string {
  const d = parseDayKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Aug 2" */
export function formatShortDate(key: string): string {
  const d = parseDayKey(key);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "March" */
export function monthName(key: string): string {
  const d = parseDayKey(key);
  return [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ][d.getMonth()];
}

/** Whether `day` is `today` or the day before: the days that can still be filled in. */
export const isTodayOrYesterday = (day: string, today: string) =>
  day === today || day === addDays(today, -1);

/** "Today", "Yesterday", or the weekday ("Tuesday") for an earlier day. */
export function dayWord(day: string, today: string): string {
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  return weekdayName(day);
}

/** `now`'s clock time on `day`, as an ISO timestamp: when something logged after the fact is dated. */
export function atTimeOn(day: string, now: Date = new Date()): string {
  const d = parseDayKey(day);
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return d.toISOString();
}
