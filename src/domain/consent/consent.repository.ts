import type { HealthConsentRecord } from './models/healthConsent';

/** The account's consent to keep health data on the server. */
export interface ConsentRepository {
  /** What was agreed to, or null if never (or withdrawn). */
  get(): Promise<HealthConsentRecord | null>;
  /** Records agreement to `policyVersion` now, replacing any earlier one. */
  give(policyVersion: string): Promise<HealthConsentRecord>;
  withdraw(): Promise<void>;
}

export function createMemoryConsentRepository(
  initial: HealthConsentRecord | null = null,
): ConsentRepository {
  let record = initial;
  return {
    get: async () => record,
    give: async (policyVersion) => {
      record = { policyVersion, consentedAt: new Date().toISOString() };
      return record;
    },
    withdraw: async () => {
      record = null;
    },
  };
}
