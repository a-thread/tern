import { dayKey, formatShortDate } from '@shared/utils/date';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';

/** What tapping the Tern Plus row in Settings does. */
export enum PlusAction {
  /** The paywall, then making an account. */
  Subscribe = 'subscribe',
  /** Plus is bought on this phone but there's no account yet: straight to making one. */
  MakeAccount = 'makeAccount',
  /** The store's own page for the subscription: change plan, cancel. */
  Manage = 'manage',
  /** Plus has ended on this account: the paywall, to take it out again. */
  Renew = 'renew',
  /** Nothing to do here (a grant made by hand, or the store couldn't be reached). */
  None = 'none',
}

export type PlusRowState = {
  signedIn: boolean;
  /** The store (or the server) has answered for this account. */
  known: boolean;
  /** Signed in, and both the store and the server say Plus has ended. */
  lapsed: boolean;
  status: SubscriptionStatus;
};

const MANAGE = 'Manage subscription';

/**
 * The Tern Plus row's title, line and what tapping it does. A subscription bought in the
 * store has an end date it renews at or stops at. Plus granted by hand (a tester, a
 * grandfathered account, a test build) has neither, and nothing to pay, renew or cancel, so
 * the row just names it rather than offering to manage it.
 */
export function plusSummary(state: PlusRowState): {
  title: string;
  summary: string;
  action: PlusAction;
} {
  const { signedIn, known, lapsed, status } = state;
  if (!signedIn) {
    return status.active
      ? {
          title: MANAGE,
          summary: 'Tern Plus is on · make an account to start syncing',
          action: PlusAction.MakeAccount,
        }
      : {
          title: MANAGE,
          summary: 'Tern Plus is off · sync and back up your log',
          action: PlusAction.Subscribe,
        };
  }
  if (lapsed) {
    return {
      title: MANAGE,
      summary: 'Tern Plus ended · your log is kept on this phone',
      action: PlusAction.Renew,
    };
  }
  if (!known) {
    return {
      title: MANAGE,
      summary: "Couldn't check Tern Plus just now",
      action: PlusAction.None,
    };
  }
  if (!status.expiresAt) {
    return {
      title: 'Tern Plus',
      summary: 'Included with your account',
      action: PlusAction.None,
    };
  }
  const date = formatShortDate(dayKey(new Date(status.expiresAt)));
  return status.renews
    ? { title: MANAGE, summary: `Tern Plus · renews ${date}`, action: PlusAction.Manage }
    : {
        title: MANAGE,
        summary: `Tern Plus until ${date} · won't renew`,
        action: PlusAction.Manage,
      };
}
