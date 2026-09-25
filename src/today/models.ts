import { CORE_MEALS, type FoodEntry } from '@food/models';
import { isLoggedToday, type WeightEntry } from '@weight/models';
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

/** One step-goal change: `goal` applies from `from` (a day key) until the next entry. */
export type GoalChange = { from: string; goal: number };

/** The first entry's `from`, meaning "since the beginning". */
export const GOAL_SINCE_ALWAYS = '0000-00-00';

/**
 * Records a change of step goal effective today. Past days keep the goal they
 * were judged against, so raising the goal never retroactively breaks a
 * streak (and lowering it never rewrites history either). Changes made on the
 * same day replace each other, so dragging a slider leaves one entry.
 */
export function recordGoalChange(
  history: GoalChange[],
  previousGoal: number,
  nextGoal: number,
  today: string,
): GoalChange[] {
  if (previousGoal === nextGoal) return history;
  const base = history.length
    ? history
    : [{ from: GOAL_SINCE_ALWAYS, goal: previousGoal }];
  const last = base[base.length - 1];
  if (last.from === today) {
    const earlier = base.slice(0, -1);
    // Back to what it was before today: nothing to record.
    if (earlier.length && earlier[earlier.length - 1].goal === nextGoal) {
      return earlier;
    }
    return [...earlier, { from: today, goal: nextGoal }];
  }
  return [...base, { from: today, goal: nextGoal }];
}

/** The step goal that applied on `day`. With no recorded changes, it's the current goal. */
export function goalFor(
  history: GoalChange[],
  currentGoal: number,
  day: string,
): number {
  if (!history.length) return currentGoal;
  let goal = history[0].goal;
  for (const change of history) {
    if (change.from <= day) goal = change.goal;
  }
  return goal;
}

export const STEP_GOAL_MIN = 2000;
export const STEP_GOAL_MAX = 15000;

/**
 * A gentle, optional suggestion for the step goal, from the last 30 days that
 * have steps. Only when the goal is clearly off: reached on nearly every day
 * (suggest a bit more) or on very few (suggest something more reachable).
 * Null when there's too little data or the goal already fits.
 */
export function suggestGoal(
  days: DayRecord[],
  currentGoal: number,
): number | null {
  const recent = days.slice(-30).filter((d) => d.steps > 0);
  if (recent.length < 14) return null;
  const hitRate = recent.filter((d) => d.steps >= d.goal).length / recent.length;
  const round = (n: number) => Math.round(n / 100) * 100;

  if (hitRate >= 0.9) {
    const next = Math.min(currentGoal + 1000, STEP_GOAL_MAX);
    return next > currentGoal ? next : null;
  }
  if (hitRate <= 0.25) {
    const sorted = recent.map((d) => d.steps).sort((a, b) => a - b);
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    const next = Math.max(round(p75), STEP_GOAL_MIN);
    return next <= currentGoal - 500 ? next : null;
  }
  return null;
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

export function greetingFor(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Hello';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export type LeftToDoItem =
  | { kind: 'meal'; meal: FoodEntry['meal']; title: string; sub: string }
  | { kind: 'weight' }
  | { kind: 'water'; totalOz: number; goalOz: number }
  | { kind: 'checkIn' }
  | { kind: 'medication'; medicationId: string; name: string; at: number };

/** How often the person weighs in. */
type WeighInPlan = { frequency: 'daily' | 'weekly'; weekday: number };

/** A medication still to be taken today. */
type DueMedication = { id: string; name: string; at: number };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * Whether Today should ask for a weigh-in. Never once one is logged today.
 * Daily: every day. Weekly: on the chosen weekday (1 = Sunday … 7 =
 * Saturday), or once a week or more has passed since the last one. With no
 * weigh-in on record, weekly asks only on the chosen weekday, so someone who
 * hasn't started weighing in isn't asked every day.
 */
export function weighInDue(
  lastWeight: WeightEntry | undefined,
  now: Date,
  { frequency, weekday }: WeighInPlan,
): boolean {
  if (lastWeight && isLoggedToday(lastWeight.loggedAt, now)) return false;
  if (frequency === 'daily') return true;
  if (now.getDay() + 1 === weekday) return true;
  if (!lastWeight) return false;
  const daysSince = Math.round(
    (startOfDay(now) - startOfDay(new Date(lastWeight.loggedAt))) / 86_400_000,
  );
  return daysSince >= 7;
}

/** The meal it's most likely time for: breakfast before 11, lunch before 4, then dinner. */
export function mealForTime(now: Date): FoodEntry['meal'] {
  const h = now.getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  return 'dinner';
}

/**
 * What's still open on Today. A meal row until every core meal is logged or
 * marked as skipped (a generic "Log a meal" while none is, then the next
 * missing meal), a weight row when a weigh-in is due (see `weighInDue`; daily
 * unless told otherwise, never when weight isn't tracked), and a row for each
 * medication not yet taken. Empty means done.
 */
export function leftToDo(
  foodLog: FoodEntry[],
  lastWeight: WeightEntry | undefined,
  now: Date = new Date(),
  options: {
    /** How often to ask for a weigh-in; null when weight isn't tracked. */
    weighIn?: WeighInPlan | null;
    /** Core meals marked "nothing today"; they count as covered. */
    skippedMeals?: readonly FoodEntry['meal'][];
    medications?: readonly DueMedication[];
    /** Today's water so far and the goal; omit (or null) when water isn't tracked. */
    water?: { totalOz: number; goalOz: number } | null;
    /** True while mood tracking is on and today's check-in is still to do. */
    checkIn?: boolean;
  } = {},
): LeftToDoItem[] {
  const items: LeftToDoItem[] = [];

  const skipped = options.skippedMeals ?? [];
  const missing = CORE_MEALS.filter(
    (m) => !skipped.includes(m) && !foodLog.some((f) => f.meal === m),
  );
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

  const weighIn =
    options.weighIn === undefined ? { frequency: 'daily' as const, weekday: 1 } : options.weighIn;
  if (weighIn && weighInDue(lastWeight, now, weighIn)) {
    items.push({ kind: 'weight' });
  }

  if (options.water && options.water.totalOz < options.water.goalOz) {
    items.push({ kind: 'water', ...options.water });
  }

  if (options.checkIn) items.push({ kind: 'checkIn' });

  for (const m of options.medications ?? []) {
    items.push({ kind: 'medication', medicationId: m.id, name: m.name, at: m.at });
  }

  return items;
}

export type TodaySummary = {
  /** The meals logged today (in day order) and their calories; null when nothing is logged. */
  meals: { names: FoodEntry['meal'][]; calories: number } | null;
  /** Today's weigh-in, if there is one. */
  weighedIn: WeightEntry | null;
  /** Names of the medications taken today. */
  medications: string[];
  stepGoalReached: boolean;
  /** Ounces of water today; null when none was logged (or water isn't tracked). */
  waterOz: number | null;
  /** Today's mood and stress check-in, if there is one. */
  checkIn: { mood: number; stress: number } | null;
};

const MEAL_ORDER: FoodEntry['meal'][] = ['breakfast', 'lunch', 'dinner', 'snack'];

/** What has been done today, for the card that replaces "left to do" once it's empty. */
export function todaySummary(
  foodLog: FoodEntry[],
  lastWeight: WeightEntry | undefined,
  takenMedicationNames: string[],
  stepGoalReached: boolean,
  now: Date = new Date(),
  waterOz = 0,
  checkIn: { mood: number; stress: number } | null = null,
): TodaySummary {
  const names = MEAL_ORDER.filter((m) => foodLog.some((f) => f.meal === m));
  const calories = foodLog.reduce((sum, f) => sum + f.calories * f.servings, 0);
  return {
    meals: names.length ? { names, calories: Math.round(calories) } : null,
    weighedIn: lastWeight && isLoggedToday(lastWeight.loggedAt, now) ? lastWeight : null,
    medications: takenMedicationNames,
    stepGoalReached,
    waterOz: waterOz > 0 ? waterOz : null,
    checkIn,
  };
}
