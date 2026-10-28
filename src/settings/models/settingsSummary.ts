import type { AppSettings } from '../../domain/settings/models/appSettings';
import { remindersOn } from '../../domain/settings/models/reminderPlan';

/**
 * How many kinds of reminder will actually fire (see `remindersOn`), medication counted
 * once however many medications remind.
 */
export function activeReminderCount(s: AppSettings): number {
  return Object.values(
    remindersOn(s.reminders, { ...s, readSteps: s.healthData.readSteps }),
  ).filter(Boolean).length;
}

/** The Settings index line for reminders: "4 on", or "Off". */
export function remindersSummary(s: AppSettings): string {
  const n = activeReminderCount(s);
  return n ? `${n} on` : 'Off';
}

/**
 * The Settings index line for health data: what Tern reads from the health app. Workouts are
 * only read as movement, so they're left out while movement isn't tracked.
 */
export function healthDataSummary(s: AppSettings): string {
  const { readSteps } = s.healthData;
  const readWorkouts = s.healthData.readWorkouts && s.trackMovement;
  if (readSteps && readWorkouts) return 'Steps and workouts';
  if (readSteps) return 'Steps';
  if (readWorkouts) return 'Workouts';
  return 'Not reading anything';
}
