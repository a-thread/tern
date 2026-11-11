import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createRequiredContext } from '@shared/state/createRequiredContext';
import { useLoader } from '@shared/hooks/useLoader';
import type { SubscriptionRepository } from './subscription.repository';
import {
  NO_SUBSCRIPTION,
  type PlanOption,
  sortPlans,
  sortTips,
  type SubscriptionStatus,
  type TipOption,
} from './models/subscription';

type SubscriptionContextValue = {
  /** False until the status and plans have loaded once. */
  ready: boolean;
  /** Tern Plus is on, so an account can be made and synced. */
  active: boolean;
  /** Plus is on as Tern Plus Supporter: the thank-you (a trail colour on Journey) is theirs. */
  supporter: boolean;
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
  /** The tip jar's amounts, smallest first; empty when the store has none. */
  tips: TipOption[];
  /** Leaves a tip. True once paid; false if the person backed out. Throws if the store failed. */
  tip: (id: string) => Promise<boolean>;
};

const [SubscriptionContext, useSubscription] =
  createRequiredContext<SubscriptionContextValue>(
    'useSubscription',
    'SubscriptionProvider',
  );
export { useSubscription };

/** Plus granted by the server rather than bought: a manual grant, for testers and grandfathered accounts. */
const GRANTED: SubscriptionStatus = { active: true, renews: false, expiresAt: null };

/**
 * Tern Plus. App-wide, above the sign-in screens, since buying comes before making an
 * account. `userId` ties purchases to the signed-in account; null while on the phone.
 *
 * `serverGrant` asks the server whether the signed-in account has Plus. It's asked only
 * when the store says no, so an account given Plus by hand (no purchase behind it) counts
 * too, and a later "no" from the store doesn't take it away.
 */
export function SubscriptionProvider({
  repo,
  userId,
  serverGrant,
  children,
}: {
  repo: SubscriptionRepository;
  userId: string | null;
  serverGrant?: () => Promise<boolean>;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<SubscriptionStatus>(NO_SUBSCRIPTION);
  const [checked, setChecked] = useState<{
    for: string | null | undefined;
    known: boolean;
  }>({ for: undefined, known: false });
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [tips, setTips] = useState<TipOption[]>([]);
  const granted = useRef(false);

  // Identifying first means the status read is the account's, not the phone's.
  const { ready } = useLoader(
    useCallback(async () => {
      let identified = await repo.identify(userId).catch((e) => {
        // Unknown, not "no Plus": nothing is moved on a status the store didn't give.
        console.warn('Could not reach the store for Tern Plus', e);
        return null;
      });
      let byGrant = false;
      if (identified && !identified.active && userId && serverGrant) {
        const server = await serverGrant().catch((e) => {
          console.warn('Could not ask the server about Tern Plus', e);
          return null;
        });
        if (server) {
          identified = GRANTED;
          byGrant = true;
        } else if (server === null) {
          // The store says no but the server couldn't say: unknown, so nothing is moved.
          identified = null;
        }
      }
      const offered = await repo.plans().catch((e) => {
        // A store that can't be reached doesn't stop the status from counting.
        console.warn('Could not load Tern Plus plans', e);
        return [];
      });
      const jar = await repo.tips().catch((e) => {
        // No tip jar is just no tip jar.
        console.warn('Could not load the tip jar', e);
        return [];
      });
      return { identified, offered, jar, userId, byGrant };
    }, [repo, userId, serverGrant]),
    ({ identified, offered, jar, userId: forUser, byGrant }) => {
      granted.current = byGrant;
      setStatus(identified ?? NO_SUBSCRIPTION);
      setChecked({ for: forUser, known: identified !== null });
      setPlans(sortPlans(offered));
      setTips(sortTips(jar));
    },
    'Could not load Tern Plus',
  );

  useEffect(
    () =>
      repo.onChange((next) => {
        // The store has no purchase for a granted account, so its "no" changes nothing.
        if (granted.current && !next.active) return;
        setStatus(next);
      }),
    [repo],
  );

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

  const tip = useCallback((id: string) => repo.tip(id), [repo]);

  const value = useMemo(
    () => ({
      ready,
      active: status.active,
      supporter: status.active && Boolean(status.supporter),
      checkedFor: checked.for,
      known: checked.known,
      status,
      plans,
      purchase,
      restore,
      tips,
      tip,
    }),
    [ready, status, checked, plans, purchase, restore, tips, tip],
  );
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
