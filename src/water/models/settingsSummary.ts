import type { AppSettings } from '@settings/models/appSettings';
import { formatVolume } from '@shared/utils/units';

/** The Settings index line for water: "64 oz a day", or "Off". */
export function waterSummary(s: AppSettings): string {
  return s.trackWater ? `${formatVolume(s.waterGoalOz, s.units)} a day` : 'Off';
}
