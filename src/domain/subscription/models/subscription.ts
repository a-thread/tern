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
