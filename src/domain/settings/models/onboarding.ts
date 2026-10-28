/** The one-time tips, each shown once on its own screen. */
export enum Tip {
  WeekStrip = 'weekStrip',
  RestDay = 'restDay',
  Waypoints = 'waypoints',
  FoodSkipMeal = 'foodSkipMeal',
  FoodSwipe = 'foodSwipe',
}

/** Each screen's tips, in the order they are shown there. */
export class Tips {
  static readonly TODAY: readonly Tip[] = [
    Tip.WeekStrip,
    Tip.RestDay,
    Tip.Waypoints,
  ];
  static readonly FOOD: readonly Tip[] = [Tip.FoodSkipMeal, Tip.FoodSwipe];
}

/**
 * How far someone is through getting started: the setup wizard, the tips on Today, the
 * getting-started card, and whether the phone may ask to send notifications yet.
 */
export type OnboardingState = {
  wizardDone: boolean;
  tipsSeen: Tip[];
  checklistHidden: boolean;
  /** False until a reminder is chosen, so the system prompt never arrives before the app is known. */
  notificationsAsked: boolean;
  /** The invitation to make an account has been answered (any answer), so it isn't shown again. */
  accountOffered: boolean;
};

export class Onboarding {
  /** A brand-new install: everything still to come. */
  static readonly NEW: OnboardingState = {
    wizardDone: false,
    tipsSeen: [],
    checklistHidden: false,
    notificationsAsked: false,
    accountOffered: false,
  };

  /** Someone already using Tern before getting started existed: none of it is shown. */
  static readonly DONE: OnboardingState = {
    wizardDone: true,
    tipsSeen: Object.values(Tip),
    checklistHidden: true,
    notificationsAsked: true,
    accountOffered: true,
  };
}

/**
 * Reads the saved onboarding state. With nothing saved or logged at all this is a new install;
 * an install in use without it comes from before it existed (an account, or a phone), so
 * that person never sees it. Anything malformed takes the "done" value, never a repeat.
 */
export function loadOnboarding(
  saved: unknown,
  inUse: boolean,
): OnboardingState {
  if (!inUse) return Onboarding.NEW;
  if (!saved || typeof saved !== 'object') return Onboarding.DONE;
  const s = saved as Partial<Record<keyof OnboardingState, unknown>>;
  const flag = (value: unknown, fallback: boolean) =>
    typeof value === 'boolean' ? value : fallback;
  const tips = Object.values(Tip);
  return {
    wizardDone: flag(s.wizardDone, true),
    tipsSeen: Array.isArray(s.tipsSeen)
      ? tips.filter((t) => (s.tipsSeen as unknown[]).includes(t))
      : tips,
    checklistHidden: flag(s.checklistHidden, true),
    notificationsAsked: flag(s.notificationsAsked, true),
    accountOffered: flag(s.accountOffered, true),
  };
}
