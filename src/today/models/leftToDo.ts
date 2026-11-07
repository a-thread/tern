import { Meals } from '../../domain/food/models/meals';
import type { FoodEntry } from '../../domain/food/models/foodEntry';
import { Frequency } from '@shared/models/frequency';
import {
  isLoggedToday,
  type WeightEntry,
} from '../../domain/weight/models/weightEntry';

export type LeftToDoItem =
  | { kind: 'meal'; meal: FoodEntry['meal']; title: string; sub: string }
  | { kind: 'weight' }
  | { kind: 'water'; totalOz: number; goalOz: number }
  | { kind: 'checkIn' }
  | { kind: 'medication'; medicationId: string; name: string; at: number };

/** How often the person weighs in. */
type WeighInPlan = { frequency: Frequency; weekday: number };

/** A medication still to be taken today. */
type DueMedication = { id: string; name: string; at: number };

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

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
  if (frequency === Frequency.Daily) return true;
  if (now.getDay() + 1 === weekday) return true;
  if (!lastWeight) return false;
  const daysSince = Math.round(
    (startOfDay(now) - startOfDay(new Date(lastWeight.loggedAt))) / 86_400_000,
  );
  return daysSince >= 7;
}

/**
 * What's still open on Today. A meal row until every core meal is logged or
 * marked as skipped (the first meal still open, by name), a weight row when a weigh-in is due (see `weighInDue`; daily
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
    /** The weigh-in was marked "not weighing in" for the day; it is no longer asked for. */
    weighInSkipped?: boolean;
    /** False while food isn't tracked: no meal row at all. */
    meals?: boolean;
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
  if (options.meals === false) {
    // Food isn't tracked: nothing to log.
  } else if (missing.length > 0) {
    // Always the first meal still open, by name, so the row says where it goes. (Going by the
    // clock opened lunch for someone who hadn't logged breakfast yet.)
    const logged = Meals.CORE.length - missing.length;
    items.push({
      kind: 'meal',
      meal: missing[0],
      title: `Log ${missing[0]}`,
      sub:
        logged === 0 && skipped.length === 0
          ? 'No meals logged yet'
          : `${logged} of ${Meals.CORE.length} meals logged`,
    });
  }

  const weighIn =
    options.weighIn === undefined
      ? { frequency: Frequency.Daily, weekday: 1 }
      : options.weighIn;
  if (
    weighIn &&
    !options.weighInSkipped &&
    weighInDue(lastWeight, now, weighIn)
  ) {
    items.push({ kind: 'weight' });
  }

  if (options.water && options.water.totalOz < options.water.goalOz) {
    items.push({ kind: 'water', ...options.water });
  }

  if (options.checkIn) items.push({ kind: 'checkIn' });

  for (const m of options.medications ?? []) {
    items.push({
      kind: 'medication',
      medicationId: m.id,
      name: m.name,
      at: m.at,
    });
  }

  return items;
}
