// The `plus` Edge Function: keeps tern.entitlements in step with RevenueCat.
//
// Two callers:
// - RevenueCat's webhook, sending the shared secret as its Authorization header. Any event
//   makes the function look up every account it names.
// - The app, with the signed-in user's token, when an account loads. RevenueCat doesn't
//   always send an event when a purchase made before sign-up is tied to the new account,
//   so the app asks for its own account to be looked up.
//
// Either way it asks RevenueCat for the current state rather than trusting the event,
// so events arriving late or out of order can't leave a wrong answer behind.
//
// Deploy with `supabase functions deploy plus --no-verify-jwt` (RevenueCat sends no JWT;
// the app's token is checked here). Secrets: REVENUECAT_WEBHOOK_SECRET and
// REVENUECAT_SECRET_KEY. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided.

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  accountsIn,
  isAccountId,
  isWebhookAuthorized,
  plusFrom,
  stillCounts,
  type Subscriber,
  type WebhookEvent,
} from './entitlement.ts';

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { db: { schema: 'tern' }, auth: { persistSession: false } },
);

async function lookUp(userId: string): Promise<void> {
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    { headers: { Authorization: `Bearer ${Deno.env.get('REVENUECAT_SECRET_KEY')}` } },
  );
  if (!res.ok) throw new Error(`RevenueCat answered ${res.status} for ${userId}`);
  const plus = plusFrom((await res.json()) as Subscriber);

  // A grant made by hand outlives whatever the store says.
  const { data: existing, error: readError } = await db
    .from('entitlements')
    .select('source')
    .eq('user_id', userId)
    .maybeSingle();
  if (readError) throw readError;
  if (existing?.source === 'manual') return;

  if (plus.entitled) {
    const { error } = await db.from('entitlements').upsert({
      user_id: userId,
      plus_expires_at: plus.expiresAt,
      source: 'revenuecat',
      updated_at: new Date().toISOString(),
    });
    // An id RevenueCat knows but Supabase doesn't (a deleted account) has nowhere to go.
    if (error && error.code !== '23503') throw error;
  } else {
    const { error } = await db
      .from('entitlements')
      .delete()
      .eq('user_id', userId)
      .eq('source', 'revenuecat');
    if (error) throw error;
  }
}

/** The signed-in user a request from the app is for, or null. */
async function caller(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error || !isAccountId(data.user?.id) ? null : data.user!.id;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';
    if (isWebhookAuthorized(req.headers.get('Authorization'), secret)) {
      const body = (await req.json()) as { event?: WebhookEvent };
      for (const userId of accountsIn(body.event ?? {})) await lookUp(userId);
      return new Response('ok');
    }

    const userId = await caller(req);
    if (!userId) return new Response('Unauthorized', { status: 401 });
    await lookUp(userId);
    const { data } = await db
      .from('entitlements')
      .select('plus_expires_at')
      .eq('user_id', userId)
      .maybeSingle();
    return Response.json({
      entitled: data !== null && stillCounts(data.plus_expires_at),
      expiresAt: data?.plus_expires_at ?? null,
    });
  } catch (e) {
    console.error(e);
    // A 5xx makes RevenueCat retry the webhook later.
    return new Response('Could not update Tern Plus', { status: 500 });
  }
});
