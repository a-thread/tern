import { useAuth } from '@/domain/auth/AuthContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { isPlusLapsed } from '@/domain/subscription/models/subscription';

/**
 * Signed in, but the store says this account's Tern Plus has ended: the log is kept on
 * the phone (see AuthGate), so Settings offers to renew. False while the store hasn't
 * answered, or couldn't be reached.
 */
export function usePlusLapsed(): boolean {
  return isPlusLapsed(useAuth()?.session?.user.id, useSubscription());
}
