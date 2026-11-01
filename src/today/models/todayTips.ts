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
    case Tip.Settings:
      return {
        lead: 'Settings are here.',
        rest: 'Change your goals, what you track, your reminders and your account, any time.',
      };
    case Tip.TabToday:
      return {
        lead: 'Today is home.',
        rest: "Your steps, what's left to do and what you've done today.",
      };
    case Tip.TabFood:
      return {
        lead: 'Food is your log.',
        rest: "Add meals and snacks, and see the day's nutrition.",
      };
    case Tip.TabTrends:
      return {
        lead: 'Trends shows patterns.',
        rest: 'Whatever you are tracking, trends show your progress over weeks and months.',
      };
    case Tip.TabJourney:
      return {
        lead: 'Journey is your migration.',
        rest: 'Waypoints fly your tern along the real Arctic tern route, one stop at a time.',
      };
    case Tip.Waypoints:
      return {
        lead: 'Waypoints are for showing up.',
        rest: 'You earn them for logging, moving, resting and hitting your goals. See what each is worth on Journey.',
      };
    default:
      return {
        lead: 'Tap a day to look back.',
        rest: 'Yesterday can still be filled in.',
      };
  }
}
