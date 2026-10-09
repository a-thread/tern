import type { AppSettings } from '@settings/models/appSettings';

/** The Settings index line for steps and activity: "8,000 steps · 2 rest days · movement on". */
export function activitySummary(s: AppSettings): string {
  const rest = `${s.restDaysPerWeek} rest ${s.restDaysPerWeek === 1 ? 'day' : 'days'}`;
  return [`${s.stepGoal.toLocaleString('en-US')} steps`, rest, s.trackMovement ? 'movement on' : null]
    .filter(Boolean)
    .join(' · ');
}
