import type { RemindersOn } from '@/domain/settings/models/reminderPlan';

/** No steps (null) while unreadable, rather than a misleading "0 steps". */
export function restDetail(steps: number | null, streak: number): string {
  return [
    ...(steps !== null ? [`${steps.toLocaleString()} steps`] : []),
    ...(streak > 0 ? [`☀ ${streak} ${streak === 1 ? 'day' : 'days'}`] : []),
  ].join(' · ');
}

/** Reminders are quiet until tomorrow, except medication. */
export function restReminderNote(on: RemindersOn): string | undefined {
  const quieted =
    on.meals || on.eat || on.weighIn || on.water || on.mood || on.streak;
  if (!quieted) return undefined;
  return on.medication
    ? 'Reminders are quiet until tomorrow, except medication'
    : 'Reminders are quiet until tomorrow';
}

export type PastRestCopy = {
  line: string;
  note?: string;
  /** The note ends in a link to the Rest days settings, where auto-detect is switched. */
  linksToSettings?: boolean;
};

/** An auto-detected one says so and links to the setting. "A lighter day", never "under your goal". */
export function pastRestCopy(chosen: boolean): PastRestCopy {
  if (chosen) return { line: 'A day off. Your streak carried on.' };
  return {
    line: 'A lighter day became a rest day. Your streak carried on.',
    note: 'Set automatically',
    linksToSettings: true,
  };
}
