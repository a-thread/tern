import type { Medication } from './medication';

/** Whether a medication is scheduled on a weekday (1 = Sunday … 7 = Saturday). */
export function isScheduledOn(med: Medication, weekday: number): boolean {
  return med.frequency === 'daily' || med.weekday === weekday;
}

/** Medications scheduled for a weekday that are not yet taken today, earliest due first. */
export function dueMeds(
  meds: readonly Medication[],
  takenToday: ReadonlySet<string>,
  weekday: number,
): Medication[] {
  return meds
    .filter((m) => isScheduledOn(m, weekday) && !takenToday.has(m.id))
    .sort((a, b) => a.at - b.at || a.name.localeCompare(b.name));
}

/** Medications taken today, earliest due first. */
export function takenMeds(
  meds: readonly Medication[],
  takenToday: ReadonlySet<string>,
): Medication[] {
  return meds
    .filter((m) => takenToday.has(m.id))
    .sort((a, b) => a.at - b.at || a.name.localeCompare(b.name));
}