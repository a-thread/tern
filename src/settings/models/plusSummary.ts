import { dayKey, formatShortDate } from '@shared/utils/date';
import type { SubscriptionStatus } from '@/domain/subscription/models/subscription';

/** What tapping the Tern Plus row in Your data does. */
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

export type PlusSectionState = {
  signedIn: boolean;
  /** The store (or the server) has answered for this account. */
  known: boolean;
  /** Signed in, and both the store and the server say Plus has ended. */
  lapsed: boolean;
  status: SubscriptionStatus;
  /** Where the subscription is managed, as said mid-sentence: "Google Play". */
  store: string;
};

export type PlusSectionText = {
  /** Where the data is: on this phone, or synced to the account. */
  title: string;
  summary: string;
  /** The summary is the next step (renew, learn more), shown as a link. */
  link: boolean;
  /** A line under the group, for a synced account with something to explain. */
  footnote?: string;
  action: PlusAction;
};

const SYNCED = 'Synced to your account';
const ON_PHONE = 'Kept on this phone';

/**
 * The Tern Plus row in Your data: where the data is, the subscription's state, and the one
 * thing to do about it. A subscription bought in the store has an end date it renews at or
 * stops at. Plus granted by hand (a tester, a grandfathered account, a test build) has
 * neither, and nothing to pay, renew or cancel, so it just says it's included.
 */
export function plusSummary(state: PlusSectionState): PlusSectionText {
  const { signedIn, known, lapsed, status, store } = state;
  if (!signedIn) {
    return status.active
      ? {
          title: ON_PHONE,
          summary: 'Tern Plus is on · make your account',
          link: true,
          action: PlusAction.MakeAccount,
        }
      : {
          title: ON_PHONE,
          summary: 'Learn about Tern Plus',
          link: true,
          action: PlusAction.Subscribe,
        };
  }
  if (lapsed) {
    return {
      title: ON_PHONE,
      summary: 'Renew Tern Plus to sync again',
      link: true,
      action: PlusAction.Renew,
    };
  }
  if (!known) {
    return {
      title: SYNCED,
      summary: "Couldn't check Tern Plus just now",
      link: false,
      action: PlusAction.None,
    };
  }
  if (!status.expiresAt) {
    return {
      title: SYNCED,
      summary: 'Tern Plus · included with your account',
      link: false,
      action: PlusAction.None,
    };
  }
  const date = formatShortDate(dayKey(new Date(status.expiresAt)));
  return {
    title: SYNCED,
    summary: status.renews
      ? `Tern Plus · renews ${date}`
      : `Tern Plus until ${date} · won't renew`,
    link: false,
    footnote: `Change plan or cancel in ${store}. If Plus ends, your data is kept on this phone.`,
    action: PlusAction.Manage,
  };
}
