/** Morning or afternoon, for a time shown on a 12-hour clock. */
export enum Meridiem {
  Am = 'am',
  Pm = 'pm',
}

const DAY = 24 * 60;
const wrap = (n: number, size: number) => ((n % size) + size) % size;

/** A time of day (minutes after midnight) as a 12-hour clock reads it: 8:30 pm is 8, 30, pm. */
export function clockParts(minutes: number): {
  hour: number;
  minute: number;
  meridiem: Meridiem;
} {
  const h = Math.floor(wrap(minutes, DAY) / 60);
  return {
    hour: h % 12 || 12,
    minute: wrap(minutes, 60),
    meridiem: h < 12 ? Meridiem.Am : Meridiem.Pm,
  };
}

const fromParts = (hour: number, minute: number, meridiem: Meridiem) =>
  ((hour % 12) + (meridiem === Meridiem.Pm ? 12 : 0)) * 60 + minute;

/** One hour on, or back, round the whole day: 11 am → noon, 12 am → 11 pm. */
export const stepHour = (minutes: number, direction: 1 | -1): number =>
  wrap(minutes + direction * 60, DAY);

/**
 * The minutes moved to the next `step` mark in that direction, inside the same hour:
 * 8:45 → 8:00 going up, 8:07 → 8:00 going down.
 */
export function stepMinute(
  minutes: number,
  direction: 1 | -1,
  step: number,
): number {
  const { hour, minute, meridiem } = clockParts(minutes);
  const next =
    direction > 0
      ? Math.floor(minute / step) * step + step
      : Math.ceil(minute / step) * step - step;
  return fromParts(hour, wrap(next, 60), meridiem);
}

/** The same time in the other half of the day: 8 am → 8 pm. */
export const withMeridiem = (minutes: number, meridiem: Meridiem): number => {
  const { hour, minute } = clockParts(minutes);
  return fromParts(hour, minute, meridiem);
};

/** A typed hour (1–12) put into the time, or null while it isn't one. */
export function withTypedHour(minutes: number, text: string): number | null {
  const hour = Number(text);
  if (!/^\d{1,2}$/.test(text.trim()) || hour < 1 || hour > 12) return null;
  const { minute, meridiem } = clockParts(minutes);
  return fromParts(hour, minute, meridiem);
}

/** A typed minute (0–59) put into the time, or null while it isn't one. */
export function withTypedMinute(minutes: number, text: string): number | null {
  const minute = Number(text);
  if (!/^\d{1,2}$/.test(text.trim()) || minute > 59) return null;
  const { hour, meridiem } = clockParts(minutes);
  return fromParts(hour, minute, meridiem);
}
