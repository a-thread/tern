import type { AppSettings } from '@settings/models/appSettings';

/** The Settings index line for medication: "2 tracked", or "Optional" while there are none. */
export function medicationSummary(s: AppSettings): string {
  return s.medications.length ? `${s.medications.length} tracked` : 'Optional';
}
