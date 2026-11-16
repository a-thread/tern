/**
 * Whether About Tern offers Supporter under the tip jar. Someone who already has Plus sees
 * their plan under Your data, so About only ever asks.
 */
export enum SupportOffer {
  /** Signed out with no Plus, or signed in and lapsed: become a Supporter. */
  Join = 'join',
  /**
   * Nothing to offer: Plus is on, there's no account backend, or the store hasn't answered
   * for a signed-in account (signing in again opens nothing for one that isn't lapsed).
   */
  None = 'none',
}

export function supportOffer({
  accounts,
  signedIn,
  active,
  lapsed,
}: {
  /** An account backend is configured (`useAuth()` isn't null). */
  accounts: boolean;
  signedIn: boolean;
  active: boolean;
  /** Signed in, and this account's Plus has ended. */
  lapsed: boolean;
}): SupportOffer {
  if (!accounts) return SupportOffer.None;
  if (lapsed) return SupportOffer.Join;
  if (active || signedIn) return SupportOffer.None;
  return SupportOffer.Join;
}
