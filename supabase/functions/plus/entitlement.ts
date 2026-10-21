/**
 * The `plus` function's decisions, kept apart from Deno and the network so they test in
 * Jest. No imports: Supabase deploys this folder on its own.
 */

/** The RevenueCat entitlement Tern Plus unlocks; matches `SubscriptionConfig.ENTITLEMENT` (a test checks). */
export const ENTITLEMENT = 'plus';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The parts of a RevenueCat webhook event that name who it's about. */
export type WebhookEvent = {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_from?: string[];
  transferred_to?: string[];
};

/**
 * Every Tern account an event touches. The app names RevenueCat customers by their Tern
 * user id once signed in; anonymous ids ($RCAnonymousID:…) aren't accounts, and a transfer
 * names both the old owner and the new one.
 */
export function accountsIn(event: WebhookEvent): string[] {
  const ids = [
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
    ...(event.transferred_from ?? []),
    ...(event.transferred_to ?? []),
  ];
  return [
    ...new Set(
      ids.filter((id): id is string => typeof id === 'string' && UUID.test(id)),
    ),
  ];
}

export const isAccountId = (id: unknown): id is string =>
  typeof id === 'string' && UUID.test(id);

type Entitlement = {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
};

/** What RevenueCat's `GET /v1/subscribers/{id}` returns, as far as Plus goes. */
export type Subscriber = {
  subscriber?: { entitlements?: Record<string, Entitlement | undefined> };
};

export type PlusRecord =
  | { entitled: false }
  /** `expiresAt` null: a grant that doesn't end. */
  | { entitled: true; expiresAt: string | null };

/**
 * Plus as RevenueCat has it now: absent, or until when (the later of the expiry and any
 * billing grace period). A past expiry is still recorded; the database compares it.
 */
export function plusFrom(subscriber: Subscriber): PlusRecord {
  const plus = subscriber.subscriber?.entitlements?.[ENTITLEMENT];
  if (!plus) return { entitled: false };
  if (plus.expires_date === null || plus.expires_date === undefined) {
    return { entitled: true, expiresAt: null };
  }
  const latest = [plus.expires_date, plus.grace_period_expires_date]
    .filter((d): d is string => typeof d === 'string' && !Number.isNaN(Date.parse(d)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
  return { entitled: true, expiresAt: latest ?? null };
}

/**
 * Whether a stored expiry still counts as Plus, by the same rule as `tern.has_plus()`: no
 * expiry, or one less than a day past (slack for a renewal that reaches the server late).
 */
export function stillCounts(expiresAt: string | null, now: Date = new Date()): boolean {
  if (expiresAt === null) return true;
  return Date.parse(expiresAt) > now.getTime() - 86_400_000;
}

/** Compares a request's Authorization header with the webhook secret, in constant time. */
export function isWebhookAuthorized(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const given = header.replace(/^Bearer\s+/i, '');
  if (given.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= given.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}
