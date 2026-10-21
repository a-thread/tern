import {
  NO_SUBSCRIPTION,
  Plan,
  type PlanOption,
  type SubscriptionStatus,
} from './models/subscription';

/**
 * Tern Plus: what this person has bought, and buying it. The store is the source of truth,
 * so nothing here is kept in Tern's own database.
 */
export interface SubscriptionRepository {
  status(): Promise<SubscriptionStatus>;
  /** What can be bought, as priced for this person; empty when the store has nothing to offer. */
  plans(): Promise<PlanOption[]>;
  /** Buys a plan. Resolves to the new status, or null when the person backed out. */
  purchase(id: string): Promise<SubscriptionStatus | null>;
  /** Finds purchases made on another phone, or before reinstalling. */
  restore(): Promise<SubscriptionStatus>;
  /**
   * Ties purchases to a Tern account (its user id), or back to this phone (null), so a
   * subscription bought before signing up follows the account.
   */
  identify(userId: string | null): Promise<SubscriptionStatus>;
  /** Calls `listener` when the status changes outside the app (a renewal, a refund); returns the unsubscribe. */
  onChange(listener: (status: SubscriptionStatus) => void): () => void;
}

const SAMPLE_PLANS: PlanOption[] = [
  { id: 'sample_annual', plan: Plan.Annual, price: '$29.99' },
  { id: 'sample_monthly', plan: Plan.Monthly, price: '$3.99' },
];

/** In memory: used without RevenueCat keys and in tests. Buying works and costs nothing. */
export function createMemorySubscriptionRepository(
  initial: SubscriptionStatus = NO_SUBSCRIPTION,
  plans: PlanOption[] = SAMPLE_PLANS,
): SubscriptionRepository {
  let current = initial;
  return {
    status: async () => current,
    plans: async () => [...plans],
    purchase: async (id) => {
      const option = plans.find((p) => p.id === id);
      if (!option) throw new Error(`No plan ${id}`);
      current = { active: true, renews: true, expiresAt: null };
      return current;
    },
    restore: async () => current,
    identify: async () => current,
    onChange: () => () => {},
  };
}
