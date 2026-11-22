import type { AppSettings } from '../../domain/settings/models/appSettings';
import { remindersOn } from '../../domain/settings/models/reminderPlan';

/** Medication counts once, however many remind. */
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

/** Workouts are left out while movement isn't tracked. */
export function healthDataSummary(s: AppSettings): string {
  const { readSteps } = s.healthData;
  const readWorkouts = s.healthData.readWorkouts && s.trackMovement;
  if (readSteps && readWorkouts) return 'Steps and workouts';
  if (readSteps) return 'Steps';
  if (readWorkouts) return 'Workouts';
  return 'Not reading anything';
}
