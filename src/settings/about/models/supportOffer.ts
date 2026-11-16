/** What the Supporter row under the tip jar says, if anything. */
export enum SupportOffer {
  /** Signed out with no Plus, or signed in and lapsed: become a Supporter. */
  Join = 'join',
  /** Active Plus, not Supporter. Switching plan happens in the store, so it's a thank-you. */
  PlusThanks = 'plus-thanks',
  /** Active Supporter. */
  SupporterThanks = 'supporter-thanks',
  /**
   * Nothing to offer: no account backend and no Plus, or signed in while the store hasn't
   * said (signing in again opens nothing for an account that isn't lapsed).
   */
  None = 'none',
}

export function supportOffer({
  accounts,
  signedIn,
  active,
  supporter,
  lapsed,
}: {
  /** An account backend is configured (`useAuth()` isn't null). */
  accounts: boolean;
  signedIn: boolean;
  active: boolean;
  supporter: boolean;
  /** Signed in, and this account's Plus has ended. */
  lapsed: boolean;
}): SupportOffer {
  if (active && !lapsed) {
    return supporter ? SupportOffer.SupporterThanks : SupportOffer.PlusThanks;
  }
  if (!accounts) return SupportOffer.None;
  if (signedIn) return lapsed ? SupportOffer.Join : SupportOffer.None;
  return SupportOffer.Join;
}
