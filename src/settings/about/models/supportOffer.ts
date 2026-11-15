/** What the Supporter row under the tip jar says, if anything. */
export enum SupportOffer {
  /** No Plus (or it lapsed), and accounts are available: become a Supporter. */
  Join = 'join',
  /** Active Plus, not Supporter. Switching plan happens in the store, so it's a thank-you. */
  PlusThanks = 'plus-thanks',
  /** Active Supporter. */
  SupporterThanks = 'supporter-thanks',
  /** No account backend and no Plus: nothing to offer. */
  None = 'none',
}

export function supportOffer({
  accounts,
  active,
  supporter,
  lapsed,
}: {
  /** An account backend is configured (`useAuth()` isn't null). */
  accounts: boolean;
  active: boolean;
  supporter: boolean;
  /** Signed in, and this account's Plus has ended. */
  lapsed: boolean;
}): SupportOffer {
  if (active && !lapsed) {
    return supporter ? SupportOffer.SupporterThanks : SupportOffer.PlusThanks;
  }
  return accounts ? SupportOffer.Join : SupportOffer.None;
}
