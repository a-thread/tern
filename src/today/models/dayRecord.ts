import { addDays, weekStartKey } from '@shared/utils/date';

export type DayState = 'goal' | 'partial' | 'rest' | 'none';

export type DayRecord = {
  day: string;
  steps: number;
  /** The step goal that applied on this day (goal changes only affect days from then on). */
  goal: number;
  state: DayState;
  /** The user chose this as a rest day (as opposed to it being detected). */
  chosenRest: boolean;
  isToday: boolean;
  /** Later this week than today — nothing has happened yet. */
  future: boolean;
};

export type BuildDaysInput = {
  stepsByDay: Record<string, number>;
  /** Day keys the user marked as rest days. */
  restDays: ReadonlySet<string>;
  /** The step goal in effect on a given day; see `goalFor`. */
  goalFor: (day: string) => number;
  restPerWeek: number;
  autoDetect: boolean;
  today: string;
  /** How many days to return, ending today. */
  count: number;
};

/**
 * Turns raw step counts into a day-by-day record, oldest to newest, ending
 * today. Reaching the goal always reads as 'goal'. Otherwise a chosen rest
 * day (or, with auto-detect on, any past day under the goal) reads as 'rest' —
 * within the weekly allowance, chosen days first — and anything else is
 * 'partial' (some steps) or 'none'. Weeks run Monday to Sunday.
 *
 * Auto-detect treats every day under the goal alike, so walking part of the
 * way is never worse for the streak than not walking at all, and a day with no
 * data (phone left at home, a sync that didn't happen) is covered too. It
 * starts from the first day with any steps, so the time before someone began
 * using Tern isn't read as rest.
 */
export function buildDays(input: BuildDaysInput): DayRecord[] {
  const {
    stepsByDay,
    restDays,
    goalFor,
    restPerWeek,
    autoDetect,
    today,
    count,
  } = input;
  const keys = Array.from({ length: count }, (_, i) =>
    addDays(today, i - (count - 1)),
  );

  // Chosen rest days use the allowance first, so a detected day earlier in the
  // week never crowds one the user picked.
  const chosenPerWeek = new Map<string, number>();
  for (const k of keys) {
    if (restDays.has(k) && (stepsByDay[k] ?? 0) < goalFor(k)) {
      const w = weekStartKey(k);
      chosenPerWeek.set(w, (chosenPerWeek.get(w) ?? 0) + 1);
    }
  }
  const detectedPerWeek = new Map<string, number>();
  const firstWithSteps = keys.find((k) => (stepsByDay[k] ?? 0) > 0);

  return keys.map((k) => {
    const steps = stepsByDay[k] ?? 0;
    const goal = goalFor(k);
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
      firstWithSteps !== undefined &&
      k >= firstWithSteps &&
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
      goal,
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
        goal: 0,
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