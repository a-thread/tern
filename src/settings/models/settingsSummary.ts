import type { AppSettings } from '@settings/models/appSettings';

/**
 * Reminders that will actually fire: switched on, and for something that's tracked
 * (a water reminder does nothing while water is off). Meal and streak reminders
 * belong to food logging and steps, which are always there.
 */
export function activeReminderCount(s: AppSettings): number {
  const r = s.reminders;
  return [
    r.mealLog.on,
    r.streak.on,
    r.weighIn.on && s.trackWeight,
    r.water.on && s.trackWater,
    r.mood.on && s.trackMood,
  ].filter(Boolean).length;
}

/** The Settings index line for reminders: "4 on", or "Off". */
export function remindersSummary(s: AppSettings): string {
  const n = activeReminderCount(s);
  return n ? `${n} on` : 'Off';
}

/** The Settings index line for health data: what Tern reads from Health Connect. */
export function healthDataSummary(s: AppSettings): string {
  const { readSteps, readWorkouts } = s.healthData;
  if (readSteps && readWorkouts) return 'Steps and workouts';
  if (readSteps) return 'Steps';
  if (readWorkouts) return 'Workouts';
  return 'Not reading anything';
}
