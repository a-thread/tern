import type { TernClient } from '@shared/backend/supabase';

/**
 * Refreshes the server's Plus record via the `plus` Edge Function (the webhook can miss a
 * pre-sign-up purchase). Falls back to `tern.has_plus()`; throws only if neither answers.
 */
export function createSupabasePlusSync(db: TernClient): () => Promise<boolean> {
  return async () => {
    const { data, error } = await db.functions.invoke<{ entitled: boolean }>(
      'plus',
      {
        body: {},
      },
    );
    if (!error) return Boolean(data?.entitled);
    console.warn(
      'Could not reach the plus function; asking the database',
      error,
    );
    const { data: counted, error: rpcError } = await db.rpc('has_plus');
    if (rpcError) throw rpcError;
    return Boolean(counted);
  };
}
