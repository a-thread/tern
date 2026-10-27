import { Tip } from '@/domain/settings/models/onboarding';

/** What each tip on Today says: a bold opening, then the rest. */
export function todayTipText(
  tip: Tip,
  restDays: number,
): { lead: string; rest: string } {
  switch (tip) {
    case Tip.RestDay:
      return {
        lead: 'Rest days keep your streak.',
        rest: `You get ${restDays} a week, and they still earn waypoints.`,
      };
    case Tip.Waypoints:
      return {
        lead: 'Waypoints are for showing up.',
        rest: 'Logging, moving, resting and reaching the goals you set all count. Never your weight or calorie totals.',
      };
    default:
      return {
        lead: 'Tap a day to look back.',
        rest: 'Yesterday can still be filled in.',
      };
  }
}
