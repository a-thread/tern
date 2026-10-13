import type { AppSettings } from '../../domain/settings/models/appSettings';

/** The Settings index line for mood and stress: "Daily check-in", or "Off". */
export function moodSummary(s: AppSettings): string {
  return s.trackMood ? 'Daily check-in' : 'Off';
}
