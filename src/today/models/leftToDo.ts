import { Meals } from '@food/models/meals';
import type { FoodEntry } from '@food/models/foodEntry';
import { isLoggedToday, type WeightEntry } from '@weight/models/weightEntry';

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
  const missing = Meals.CORE.filter(
    (m) => !skipped.includes(m) && !foodLog.some((f) => f.meal === m),
  );
  if (missing.length === Meals.CORE.length) {
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
      sub: `${Meals.CORE.length - missing.length} of ${Meals.CORE.length} meals logged`,
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