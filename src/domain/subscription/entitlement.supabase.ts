import type { TernClient } from '@shared/backend/supabase';

/**
 * Asks the server to look this account up in RevenueCat now (the `plus` Edge Function), so
 * its record of Tern Plus is current before anything is written. The store's webhook
 * usually does this, but not always when a purchase made before sign-up is tied to the
 * new account. Resolves to whether the server now counts the account as having Plus.
 *
 * If the function can't be reached, the database is asked directly (`tern.has_plus()`, the
 * check every save is held to), so a failing function doesn't pass for Plus. Throws only
 * when neither answers.
 */
export function createSupabasePlusSync(db: TernClient): () => Promise<boolean> {
  return async () => {
    const { data, error } = await db.functions.invoke<{ entitled: boolean }>('plus', {
      body: {},
    });
    if (!error) return Boolean(data?.entitled);
    console.warn('Could not reach the plus function; asking the database', error);
    const { data: counted, error: rpcError } = await db.rpc('has_plus');
    if (rpcError) throw rpcError;
    return Boolean(counted);
  };
}
