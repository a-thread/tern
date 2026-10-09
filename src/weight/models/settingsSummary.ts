import type { AppSettings } from '@settings/models/appSettings';
import { Frequency } from '@shared/models/frequency';
import { formatWeight } from '@shared/utils/units';

/** The Settings index line for weight: "Daily · goal 150 lb", or "Off". */
export function weightSummary(s: AppSettings): string {
  if (!s.trackWeight) return 'Off';
  const how = s.weighInFrequency === Frequency.Daily ? 'Daily' : 'Weekly';
  return s.weightGoalLb === null ? how : `${how} · goal ${formatWeight(s.weightGoalLb, s.units, 0)}`;
}
