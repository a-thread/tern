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

/** Agreed to the current policy; an older version or none means asking again. */
export const hasCurrentConsent = (
  record: HealthConsentRecord | null,
): boolean => record?.policyVersion === HealthConsent.POLICY_VERSION;
