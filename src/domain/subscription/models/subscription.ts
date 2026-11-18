/** How a plan is billed. Tern Plus is a subscription only: there is no one-time purchase. */
export enum Plan {
  Monthly = 'monthly',
  Annual = 'annual',
  Other = 'other',
}

/** Supporter is yearly Plus with a thank-you; it unlocks nothing more. */
export enum Tier {
  Plus = 'plus',
  Supporter = 'supporter',
}

/** One way to buy Tern Plus, as the store prices it for this person. */
export type PlanOption = {
  /** The store's id for it, passed back to buy it. */
  id: string;
  plan: Plan;
  tier: Tier;
  /** Set from RevenueCat offering metadata, so the paywall stops saying "founding" after a rise. */
  founding: boolean;
  /** Already formatted in the person's currency: "$4.99". */
  price: string;
  /** The same price as a number, in `currency`, for working out savings. */
  amount: number;
  /** ISO 4217 code: "USD", "EUR". */
  currency: string;
};

/** A one-off tip; unlocks nothing. */
export type TipOption = {
  /** The store's id for it, passed back to buy it. */
  id: string;
  /** Already formatted in the person's currency: "$4.99". */
  price: string;
  amount: number;
  currency: string;
};

/** Smallest first, so the jar reads left to right. */
export const sortTips = (tips: TipOption[]) =>
  [...tips].sort((a, b) => a.amount - b.amount);

export type SubscriptionStatus = {
  /** Tern Plus is on: an account syncs. */
  active: boolean;
  /** It renews by itself (false once cancelled). */
  renews: boolean;
  /** When it ends, as ISO; null when there is none. */
  expiresAt: string | null;
  /** Bought as Tern Plus Supporter. Absent or false for plain Plus and for a grant. */
  supporter?: boolean;
};

export const NO_SUBSCRIPTION: SubscriptionStatus = {
  active: false,
  renews: false,
  expiresAt: null,
};

/** What Tern Plus is called in the stores and in RevenueCat. */
export class SubscriptionConfig {
  /** The RevenueCat entitlement every Tern Plus product unlocks. */
  static readonly ENTITLEMENT = 'plus';
  /** The RevenueCat entitlement Supporter unlocks alongside `plus`. */
  static readonly SUPPORTER_ENTITLEMENT = 'supporter';
  /** The RevenueCat package (a custom one, billed yearly) that sells Supporter. */
  static readonly SUPPORTER_PACKAGE = 'supporter_annual';
  /** The key set to `true` in the current offering's metadata while the founding price is on sale. */
  static readonly FOUNDING_METADATA = 'founding';
  /** The RevenueCat offering that holds the tip jar's consumable products, one per amount. */
  static readonly TIPS_OFFERING = 'tips';
}

/** Only once the store has answered for this account; false while unknown. */
export function isPlusLapsed(
  userId: string | null | undefined,
  plus: {
    checkedFor: string | null | undefined;
    known: boolean;
    active: boolean;
  },
): boolean {
  return (
    Boolean(userId) && plus.checkedFor === userId && plus.known && !plus.active
  );
}

const ORDER = [Plan.Annual, Plan.Monthly, Plan.Other];
const TIER_ORDER = [Tier.Plus, Tier.Supporter];

/** Plus before Supporter, and yearly first within each, as the plan most people pick. */
export const sortPlans = (plans: PlanOption[]) =>
  [...plans].sort(
    (a, b) =>
      TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) ||
      ORDER.indexOf(a.plan) - ORDER.indexOf(b.plan),
  );

/** "$39.99 a year" · "$4.99 a month" */
export function priceLabel(option: PlanOption): string {
  switch (option.plan) {
    case Plan.Annual:
      return `${option.price} a year`;
    case Plan.Monthly:
      return `${option.price} a month`;
    case Plan.Other:
      return option.price;
  }
}

/** Plus yearly vs 12× monthly; null unless comparable and cheaper. Supporter is never counted. */
export function yearlySavings(
  plans: PlanOption[],
): { amount: number; percent: number; currency: string } | null {
  const plus = plans.filter((p) => p.tier === Tier.Plus);
  const yearly = plus.find((p) => p.plan === Plan.Annual);
  const monthly = plus.find((p) => p.plan === Plan.Monthly);
  if (!yearly || !monthly || yearly.currency !== monthly.currency) return null;
  const twelveMonths = monthly.amount * 12;
  const amount = Math.round((twelveMonths - yearly.amount) * 100) / 100;
  if (!(amount > 0) || !(twelveMonths > 0)) return null;
  return {
    amount,
    percent: Math.round((amount / twelveMonths) * 100),
    currency: yearly.currency,
  };
}

/** "Save $19.89 a year", or "Save 33%" when the currency can't be formatted. */
export function savingsLabel(savings: {
  amount: number;
  percent: number;
  currency: string;
}): string {
  try {
    const money = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: savings.currency,
    }).format(savings.amount);
    return `Save ${money} a year`;
  } catch {
    return `Save ${savings.percent}%`;
  }
}

export function planName(option: Pick<PlanOption, 'plan' | 'tier'>): string {
  if (option.tier === Tier.Supporter) return 'Supporter';
  switch (option.plan) {
    case Plan.Annual:
      return 'Yearly';
    case Plan.Monthly:
      return 'Monthly';
    case Plan.Other:
      return 'Tern Plus';
  }
}

/** How leaving a tip ended. */
export enum TipResult {
  Paid = 'paid',
  /** The person backed out of the store's sheet. */
  Cancelled = 'cancelled',
  /** The store took it, but the payment hasn't gone through yet (a slow card, cash at a shop). */
  Pending = 'pending',
}
