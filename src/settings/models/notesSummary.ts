import type { AppSettings } from '../../domain/settings/models/appSettings';

/** The Settings index line for day notes: "On Today", or "Off". */
export function notesSummary(s: AppSettings): string {
  return s.trackNotes ? 'On Today' : 'Off';
}
