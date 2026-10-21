import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useLoader } from '@shared/hooks/useLoader';
import type { SubscriptionRepository } from './subscription.repository';
import {
  NO_SUBSCRIPTION,
  type PlanOption,
  sortPlans,
  type SubscriptionStatus,
} from './models/subscription';

type SubscriptionContextValue = {
  /** False until the status and plans have loaded once. */
  ready: boolean;
  /** Tern Plus is on, so an account can be made and synced. */
  active: boolean;
  /**
   * Who the store was last asked about: the signed-in account's id, or null for the phone;
   * undefined before the first answer. It lags a sign-in until the store has looked the
   * account up, so `active` is only acted on once this matches the account.
   */
  checkedFor: string | null | undefined;
  /** The store answered that check. False when it couldn't be reached: `active` is then unknown, not false. */
  known: boolean;
  status: SubscriptionStatus;
  /** What can be bought, yearly first; empty when the store has nothing to offer. */
  plans: PlanOption[];
  /** Buys a plan. True once Plus is on; false if the person backed out. Throws if the store failed. */
  purchase: (id: string) => Promise<boolean>;
  /** Looks for an earlier purchase. True if one was found. Throws if the store failed. */
  restore: () => Promise<boolean>;
};

const [SubscriptionContext, useSubscription] =
  createRequiredContext<SubscriptionContextValue>(
    'useSubscription',
    'SubscriptionProvider',
  );
export { useSubscription };

/**
 * Tern Plus. App-wide, above the sign-in screens, since buying comes before making an
 * account. `userId` ties purchases to the signed-in account; null while on the phone.
 */
export function SubscriptionProvider({
  repo,
  userId,
  children,
}: {
  repo: SubscriptionRepository;
  userId: string | null;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<SubscriptionStatus>(NO_SUBSCRIPTION);
  const [checked, setChecked] = useState<{
    for: string | null | undefined;
    known: boolean;
  }>({ for: undefined, known: false });
  const [plans, setPlans] = useState<PlanOption[]>([]);

  // Identifying first means the status read is the account's, not the phone's.
  const { ready } = useLoader(
    useCallback(async () => {
      const identified = await repo.identify(userId).catch((e) => {
        // Unknown, not "no Plus": nothing is moved on a status the store didn't give.
        console.warn('Could not reach the store for Tern Plus', e);
        return null;
      });
      const offered = await repo.plans().catch((e) => {
        // A store that can't be reached doesn't stop the status from counting.
        console.warn('Could not load Tern Plus plans', e);
        return [];
      });
      return { identified, offered, userId };
    }, [repo, userId]),
    ({ identified, offered, userId: forUser }) => {
      setStatus(identified ?? NO_SUBSCRIPTION);
      setChecked({ for: forUser, known: identified !== null });
      setPlans(sortPlans(offered));
    },
    'Could not load Tern Plus',
  );

  useEffect(() => repo.onChange(setStatus), [repo]);

  const purchase = useCallback(
    async (id: string) => {
      const next = await repo.purchase(id);
      if (!next) return false;
      setStatus(next);
      return next.active;
    },
    [repo],
  );

  const restore = useCallback(async () => {
    const next = await repo.restore();
    setStatus(next);
    return next.active;
  }, [repo]);

  const value = useMemo(
    () => ({
      ready,
      active: status.active,
      checkedFor: checked.for,
      known: checked.known,
      status,
      plans,
      purchase,
      restore,
    }),
    [ready, status, checked, plans, purchase, restore],
  );
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
