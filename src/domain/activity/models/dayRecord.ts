import { addDays, weekStartKey } from '@shared/utils/date';
import { DayState } from '@shared/models/dayState';

export type DayRecord = {
  day: string;
  steps: number;
  /** The goal that applied that day (goal changes only affect later days). */
  goal: number;
  /** Movement minutes that count toward a goal day (walks and runs are in the steps). */
  minutes: number;
  movedToGoal: boolean;
  /** True even on a rest day, which still reads as rest. */
  reachedGoal: boolean;
  state: DayState;
  /** Chosen by the user, not detected. */
  chosenRest: boolean;
  isToday: boolean;
  future: boolean;
};

export type BuildDaysInput = {
  stepsByDay: Record<string, number>;
  restDays: ReadonlySet<string>;
  goalFor: (day: string) => number;
  restPerWeek: number;
  autoDetect: boolean;
  today: string;
  /** Days to return, ending today. */
  count: number;
  minutesByDay?: Record<string, number>;
  /** 0 or absent when movement doesn't count. */
  movementGoal?: number;
};

/**
 * Day-by-day record, oldest to newest, Monday-to-Sunday weeks. A chosen rest day stays rest even
 * if the goal is reached. Auto-detect covers past days under the goal within the weekly allowance
 * (chosen days first), starting from the first day with steps so pre-Tern time isn't rest.
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
    minutesByDay = {},
    movementGoal = 0,
  } = input;
  const moved = (k: string) =>
    movementGoal > 0 && (minutesByDay[k] ?? 0) >= movementGoal;
  const reached = (k: string) => (stepsByDay[k] ?? 0) >= goalFor(k) || moved(k);
  const keys = Array.from({ length: count }, (_, i) =>
    addDays(today, i - (count - 1)),
  );

  // Chosen rest days use the allowance first, so a detected day never crowds one out.
  const chosenPerWeek = new Map<string, number>();
  for (const k of keys) {
    if (restDays.has(k) && usesRestDay(k, reached(k))) {
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
    if (chosenRest) {
      state = DayState.Rest;
    } else if (reached(k)) {
      state = DayState.Goal;
    } else if (
      autoDetect &&
      k < today &&
      firstWithSteps !== undefined &&
      k >= firstWithSteps &&
      (chosenPerWeek.get(w) ?? 0) + (detectedPerWeek.get(w) ?? 0) < restPerWeek
    ) {
      detectedPerWeek.set(w, (detectedPerWeek.get(w) ?? 0) + 1);
      state = DayState.Rest;
    } else {
      state = steps > 0 ? DayState.Partial : DayState.None;
    }
    return {
      day: k,
      steps,
      goal,
      minutes: minutesByDay[k] ?? 0,
      movedToGoal: steps < goal && moved(k),
      reachedGoal: reached(k),
      state,
      chosenRest,
      isToday: k === today,
      future: false,
    };
  });
}

export const addsToStreak = (d: Pick<DayRecord, 'state' | 'reachedGoal'>) =>
  d.state === DayState.Goal || (d.state === DayState.Rest && d.reachedGoal);

/** Counted back from today. Rest and frozen days hold it; today never breaks it. */
export function computeStreak(days: DayRecord[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (addsToStreak(d)) streak += 1;
    else if (d.state === DayState.Rest || d.state === DayState.Frozen) continue;
    else if (d.isToday)
      continue; // still in progress
    else break;
  }
  return streak;
}

export class RestDayRules {
  /**
   * From here on, a rest day walked to the goal anyway still uses up the week's allowance.
   * Earlier weeks keep the old rule so no existing streak changes.
   */
  static readonly WALKED_COUNTS_FROM = '2026-11-01';
}

const usesRestDay = (day: string, reachedGoal: boolean) =>
  !reachedGoal || day >= RestDayRules.WALKED_COUNTS_FROM;

export class StreakFreezes {
  /** One earned each time the streak reaches a multiple of this. */
  static readonly EVERY = 7;
  static readonly MAX = 2;
}

export type StreakSummary = {
  days: DayRecord[];
  streak: number;
  freezes: number;
};

/**
 * Replays the streak through `buildDays` output, spending a freeze on each day that would break
 * it (marked `Frozen`). Freezes are derived, not stored, so editing history replays consistently.
 */
export function withFreezes(days: DayRecord[]): StreakSummary {
  let streak = 0;
  let freezes = 0;
  const out = days.map((d) => {
    if (addsToStreak(d)) {
      streak += 1;
      if (streak % StreakFreezes.EVERY === 0) {
        freezes = Math.min(freezes + 1, StreakFreezes.MAX);
      }
      return d;
    }
    if (d.state === DayState.Rest || d.isToday || d.future) return d;
    if (streak > 0 && freezes > 0) {
      freezes -= 1;
      return { ...d, state: DayState.Frozen };
    }
    streak = 0;
    return d;
  });
  return { days: out, streak, freezes };
}

/** Monday to Sunday of `anchor`'s week; days outside the history are placeholders. */
export function weekOf(
  days: DayRecord[],
  today: string,
  anchor: string = today,
): DayRecord[] {
  const start = weekStartKey(anchor);
  const byDay = new Map(days.map((d) => [d.day, d]));
  return Array.from({ length: 7 }, (_, i) => {
    const k = addDays(start, i);
    return (
      byDay.get(k) ?? {
        day: k,
        steps: 0,
        goal: 0,
        minutes: 0,
        movedToGoal: false,
        reachedGoal: false,
        state: DayState.None as DayState,
        chosenRest: false,
        isToday: false,
        future: k > today,
      }
    );
  });
}

/** Rest days left this week, by the same `usesRestDay` rule as `buildDays`. */
export function restDaysLeft(
  days: DayRecord[],
  today: string,
  restPerWeek: number,
): number {
  const used = weekOf(days, today).filter(
    (d) => d.state === DayState.Rest && usesRestDay(d.day, d.reachedGoal),
  ).length;
  return Math.max(restPerWeek - used, 0);
}

/** A week of zero steps usually means HealthKit access was refused, which it won't report. */
export function noStepsThisWeek(
  days: readonly Pick<DayRecord, 'steps' | 'future'>[],
): boolean {
  const past = days.filter((d) => !d.future).slice(-7);
  return past.length > 0 && past.every((d) => d.steps === 0);
}
