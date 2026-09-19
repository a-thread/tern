/** `loggedAt` is an ISO timestamp; use `formatLoggedAt` to display it. */
export type WeightEntry = { id: string; kg: number; loggedAt: string };

/** How far back the trend line reaches. */
const TREND_POINTS = 30;
/** Smoothing weight of each new reading — low, so one heavy or light day barely moves the line. */
const TREND_ALPHA = 0.3;

/**
 * The smoothed weight trend (an exponential moving average, oldest to
 * newest) — what the charts draw, so day-to-day fluctuation never reads as
 * gain or loss. Takes entries newest-first, the order they're stored in.
 */
export function computeTrend(entriesNewestFirst: WeightEntry[]): number[] {
  const trend: number[] = [];
  for (const entry of [...entriesNewestFirst].reverse()) {
    const prev = trend[trend.length - 1];
    const next =
      prev === undefined ? entry.kg : prev + TREND_ALPHA * (entry.kg - prev);
    trend.push(Math.round(next * 100) / 100);
  }
  return trend.slice(-TREND_POINTS);
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
