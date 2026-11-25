/** What the account agreed to, as the server recorded it. */
export type HealthConsentRecord = {
  policyVersion: string;
  /** ISO timestamp. */
  consentedAt: string;
};

export class HealthConsent {
  /** Bump when the privacy policy changes what's stored or who sees it, so everyone is asked again. */
  static readonly POLICY_VERSION = '2026-11';
}

/** The phone's note of what an account last agreed to, read when the server can't be. */
export const rememberedConsent = (
  userId: string,
  record: HealthConsentRecord,
): string => JSON.stringify({ userId, ...record });

/** The remembered record for `userId`, or null for another account's or anything unreadable. */
export function readRememberedConsent(
  raw: string | null,
  userId: string,
): HealthConsentRecord | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<
      HealthConsentRecord & { userId: string }
    >;
    return value.userId === userId &&
      typeof value.policyVersion === 'string' &&
      typeof value.consentedAt === 'string'
      ? { policyVersion: value.policyVersion, consentedAt: value.consentedAt }
      : null;
  } catch {
    return null;
  }
}

/** Agreed to the current policy; an older version or none means asking again. */
export const hasCurrentConsent = (
  record: HealthConsentRecord | null,
): boolean => record?.policyVersion === HealthConsent.POLICY_VERSION;
