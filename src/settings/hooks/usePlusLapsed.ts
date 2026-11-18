import { useAuth } from '@/domain/auth/AuthContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { isPlusLapsed } from '@/domain/subscription/models/subscription';

/** False until the store answers. */
export function usePlusLapsed(): boolean {
  return isPlusLapsed(useAuth()?.session?.user.id, useSubscription());
}
