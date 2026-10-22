import type { TernClient } from '@shared/backend/supabase';

/**
 * Asks the server to look this account up in RevenueCat now (the `plus` Edge Function), so
 * its record of Tern Plus is current before anything is written. The store's webhook
 * usually does this, but not always when a purchase made before sign-up is tied to the
 * new account. Resolves to whether the server now counts the account as having Plus.
 */
export function createSupabasePlusSync(db: TernClient): () => Promise<boolean> {
  return async () => {
    const { data, error } = await db.functions.invoke<{ entitled: boolean }>('plus', {
      body: {},
    });
    if (error) throw error;
    return Boolean(data?.entitled);
  };
}
