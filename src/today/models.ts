import { CORE_MEALS, type FoodEntry } from '@food/models';
import { isLoggedToday, type WeightEntry } from '@weight/models';
import { addDays, weekStartKey } from '@shared/utils/date';

export type DayState = 'goal' | 'partial' | 'rest' | 'none';

export type DayRecord = {
  day: string;
  steps: number;
  state: DayState;
  /** The user chose this as a rest day (as opposed to it being detected). */
  chosenRest: boolean;
  isToday: boolean;
  /** Later this week than today — nothing has happened yet. */
  future: boolean;
};

/** A past day with some steps, but under this share of the goal, can be detected as a rest day. */
export const AUTO_REST_BELOW = 0.4;

export type BuildDaysInput = {
  stepsByDay: Record<string, number>;
  /** Day keys the user marked as rest days. */
  restDays: ReadonlySet<string>;
  goal: number;
  restPerWeek: number;
  autoDetect: boolean;
  today: string;
  /** How many days to return, ending today. */
  count: number;
};

/**
 * Turns raw step counts into a day-by-day record, oldest to newest, ending
 * today. Reaching the goal always reads as 'goal'. Otherwise a chosen rest
 * day (or, with auto-detect on, a past low-step day) reads as 'rest' —
 * within the weekly allowance, chosen days first — and anything else is
 * 'partial' (some steps) or 'none'. Weeks run Monday to Sunday.
 */
export function buildDays(input: BuildDaysInput): DayRecord[] {
  const { stepsByDay, restDays, goal, restPerWeek, autoDetect, today, count } =
    input;
  const keys = Array.from({ length: count }, (_, i) =>
    addDays(today, i - (count - 1)),
  );

  // Chosen rest days use the allowance first, so a detected day earlier in the
  // week never crowds one the user picked.
  const chosenPerWeek = new Map<string, number>();
  for (const k of keys) {
    if (restDays.has(k) && (stepsByDay[k] ?? 0) < goal) {
      const w = weekStartKey(k);
      chosenPerWeek.set(w, (chosenPerWeek.get(w) ?? 0) + 1);
    }
  }
  const detectedPerWeek = new Map<string, number>();

  return keys.map((k) => {
    const steps = stepsByDay[k] ?? 0;
    const chosenRest = restDays.has(k);
    const w = weekStartKey(k);
    let state: DayState;
    if (steps >= goal) {
      state = 'goal';
    } else if (chosenRest) {
      state = 'rest';
    } else if (
      autoDetect &&
      k < today &&
      steps > 0 && // no data is not a rest day
      steps < goal * AUTO_REST_BELOW &&
      (chosenPerWeek.get(w) ?? 0) + (detectedPerWeek.get(w) ?? 0) < restPerWeek
    ) {
      detectedPerWeek.set(w, (detectedPerWeek.get(w) ?? 0) + 1);
      state = 'rest';
    } else {
      state = steps > 0 ? 'partial' : 'none';
    }
    return {
      day: k,
      steps,
      state,
      chosenRest,
      isToday: k === today,
      future: false,
    };
  });
}

/**
 * The current streak: days that reached the goal, counted back from today.
 * Rest days hold the streak without adding to it, and today doesn't break it
 * while it's still in progress.
 */
export function computeStreak(days: DayRecord[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.state === 'goal') streak += 1;
    else if (d.state === 'rest') continue;
    else if (d.isToday)
      continue; // still in progress
    else break;
  }
  return streak;
}

/**
 * Monday to Sunday of the week containing today, for the week strip. Days
 * after today are placeholders.
 */
export function weekOf(days: DayRecord[], today: string): DayRecord[] {
  const start = weekStartKey(today);
  const byDay = new Map(days.map((d) => [d.day, d]));
  return Array.from({ length: 7 }, (_, i) => {
    const k = addDays(start, i);
    return (
      byDay.get(k) ?? {
        day: k,
        steps: 0,
        state: 'none' as DayState,
        chosenRest: false,
        isToday: false,
        future: k > today,
      }
    );
  });
}

/** Rest days still available this week (chosen and detected both count). */
export function restDaysLeft(
  days: DayRecord[],
  today: string,
  restPerWeek: number,
): number {
  const used = weekOf(days, today).filter((d) => d.state === 'rest').length;
  return Math.max(restPerWeek - used, 0);
}

export function greetingFor(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Hello';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export type LeftToDoItem =
  | { kind: 'meal'; meal: FoodEntry['meal']; title: string; sub: string }
  | { kind: 'weight' };

/** The meal it's most likely time for: breakfast before 11, lunch before 4, then dinner. */
export function mealForTime(now: Date): FoodEntry['meal'] {
  const h = now.getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  return 'dinner';
}

/**
 * What's still open on Today. A meal row until every core meal is logged
 * (a generic "Log a meal" while nothing is logged, then the next missing
 * meal), and a weight row until a weigh-in exists for today. Empty means done.
 */
export function leftToDo(
  foodLog: FoodEntry[],
  lastWeight: WeightEntry | undefined,
  now: Date = new Date(),
): LeftToDoItem[] {
  const items: LeftToDoItem[] = [];

  const missing = CORE_MEALS.filter((m) => !foodLog.some((f) => f.meal === m));
  if (missing.length === CORE_MEALS.length) {
    items.push({
      kind: 'meal',
      meal: mealForTime(now),
      title: 'Log a meal',
      sub: 'No meals logged yet',
    });
  } else if (missing.length > 0) {
    items.push({
      kind: 'meal',
      meal: missing[0],
      title: `Log ${missing[0]}`,
      sub: `${CORE_MEALS.length - missing.length} of ${CORE_MEALS.length} meals logged`,
    });
  }

  if (!lastWeight || !isLoggedToday(lastWeight.loggedAt, now)) {
    items.push({ kind: 'weight' });
  }

  return items;
}
