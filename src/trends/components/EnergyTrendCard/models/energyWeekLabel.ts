import { addDays, formatDayRange } from '@shared/utils/date';
import type { EnergyWeek } from '@/domain/food/models/energyBalance';

/** A week on the energy chart, as a tap names it: "Jul 27 – Aug 2 · use 2,350 · logged 2,100". */
export function energyWeekLabel(week: EnergyWeek): string {
  return [
    formatDayRange(addDays(week.weekEnd, -6), week.weekEnd),
    week.burn === null ? null : `use ${week.burn.toLocaleString()}`,
    week.intake === null ? null : `logged ${week.intake.toLocaleString()}`,
  ]
    .filter(Boolean)
    .join(' · ');
}
