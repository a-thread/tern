/** How a plan is billed. Tern Plus is a subscription only: there is no one-time purchase. */
export enum Plan {
  Monthly = 'monthly',
  Annual = 'annual',
  Other = 'other',
}

/** One way to buy Tern Plus, as the store prices it for this person. */
export type PlanOption = {
  /** The store's id for it, passed back to buy it. */
  id: string;
  plan: Plan;
  /** Already formatted in the person's currency: "$3.99". */
  price: string;
  /** The same price as a number, in `currency`, for working out savings. */
  amount: number;
  /** ISO 4217 code: "USD", "EUR". */
  currency: string;
};

export type SubscriptionStatus = {
  /** Tern Plus is on: an account syncs. */
  active: boolean;
  /** It renews by itself (false once cancelled). */
  renews: boolean;
  /** When it ends, as ISO; null when there is none. */
  expiresAt: string | null;
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
}

/**
 * Signed in, and the store has answered for this account that its Tern Plus has ended: the
 * log then lives on the phone. False while the store hasn't answered, or couldn't be reached.
 */
export function isPlusLapsed(
  userId: string | null | undefined,
  plus: { checkedFor: string | null | undefined; known: boolean; active: boolean },
): boolean {
  return Boolean(userId) && plus.checkedFor === userId && plus.known && !plus.active;
}

const ORDER = [Plan.Annual, Plan.Monthly, Plan.Other];

/** Yearly first, as the plan most people pick. */
export const sortPlans = (plans: PlanOption[]) =>
  [...plans].sort((a, b) => ORDER.indexOf(a.plan) - ORDER.indexOf(b.plan));

/** "$29.99 a year" · "$3.99 a month" */
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

/**
 * What yearly saves over twelve months of monthly, or null when there isn't both plan,
 * they're priced in different currencies, or yearly doesn't come out cheaper.
 */
export function yearlySavings(
  plans: PlanOption[],
): { amount: number; percent: number; currency: string } | null {
  const yearly = plans.find((p) => p.plan === Plan.Annual);
  const monthly = plans.find((p) => p.plan === Plan.Monthly);
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

/**
 * "Save $17.89 a year", in the person's currency. Falls back to the percentage ("Save 37%")
 * where the currency can't be formatted.
 */
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

export function planName(plan: Plan): string {
  switch (plan) {
    case Plan.Annual:
      return 'Yearly';
    case Plan.Monthly:
      return 'Monthly';
    case Plan.Other:
      return 'Tern Plus';
  }
}
