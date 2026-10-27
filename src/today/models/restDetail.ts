import type { RemindersOn } from '@/domain/settings/models/reminderPlan';

/**
 * "2,310 steps · ☀ 9 days" under the rest day scene; no sun when there is no streak to show,
 * and no steps (null) while they can't be read, rather than a misleading "0 steps".
 */
export function restDetail(steps: number | null, streak: number): string {
  return [
    ...(steps !== null ? [`${steps.toLocaleString()} steps`] : []),
    ...(streak > 0 ? [`☀ ${streak} ${streak === 1 ? 'day' : 'days'}`] : []),
  ].join(' · ');
}

/**
 * The note under today's rest scene: reminders that would have fired are quiet until tomorrow,
 * except medication, which stays on. Nothing to say when no reminder would have fired.
 */
export function restReminderNote(on: RemindersOn): string | undefined {
  const quieted = on.meals || on.weighIn || on.water || on.mood || on.streak;
  if (!quieted) return undefined;
  return on.medication
    ? 'Reminders are quiet until tomorrow, except medication'
    : 'Reminders are quiet until tomorrow';
}
