import {
  NO_SUBSCRIPTION,
  Plan,
  type PlanOption,
  type SubscriptionStatus,
  Tier,
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

const sample = (
  id: string,
  plan: Plan,
  tier: Tier,
  amount: number,
): PlanOption => ({
  id,
  plan,
  tier,
  founding: false,
  price: `$${amount.toFixed(2)}`,
  amount,
  currency: 'USD',
});

const SAMPLE_PLANS: PlanOption[] = [
  sample('sample_annual', Plan.Annual, Tier.Plus, 39.99),
  sample('sample_monthly', Plan.Monthly, Tier.Plus, 4.99),
  sample('sample_supporter', Plan.Annual, Tier.Supporter, 59.99),
];

const SIGNED_IN_PLUS: SubscriptionStatus = {
  active: true,
  renews: true,
  expiresAt: null,
};

/**
 * In memory: used without RevenueCat keys and in tests. Buying works and costs nothing.
 * With `accountsHavePlus`, any signed-in account counts as having Plus, so developing
 * against Supabase without RevenueCat doesn't treat every account as lapsed.
 */
export function createMemorySubscriptionRepository(
  initial: SubscriptionStatus = NO_SUBSCRIPTION,
  plans: PlanOption[] = SAMPLE_PLANS,
  { accountsHavePlus = false }: { accountsHavePlus?: boolean } = {},
): SubscriptionRepository {
  let current = initial;
  return {
    status: async () => current,
    plans: async () => [...plans],
    purchase: async (id) => {
      const option = plans.find((p) => p.id === id);
      if (!option) throw new Error(`No plan ${id}`);
      current = {
        active: true,
        renews: true,
        expiresAt: null,
        supporter: option.tier === Tier.Supporter,
      };
      return current;
    },
    restore: async () => current,
    identify: async (userId) =>
      userId && accountsHavePlus ? SIGNED_IN_PLUS : current,
    onChange: () => () => {},
  };
}

/**
 * A release build with no store key for this platform: nothing can be bought and nobody
 * has Plus, short of a grant the server knows about. Never the free in-memory store, which
 * would let an account think it has Plus that the server then refuses every write for.
 */
export function createUnavailableSubscriptionRepository(): SubscriptionRepository {
  return {
    status: async () => NO_SUBSCRIPTION,
    plans: async () => [],
    purchase: async () => {
      throw new Error('Tern Plus is not available in this build');
    },
    restore: async () => NO_SUBSCRIPTION,
    identify: async () => NO_SUBSCRIPTION,
    onChange: () => () => {},
  };
}
