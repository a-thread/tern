import React, { createContext, useContext, useMemo } from 'react';

import type { HealthConsentRecord } from './models/healthConsent';

type HealthConsentValue = {
  /** null when the account said "Not now" or withdrew. */
  given: HealthConsentRecord | null;
  /** Keeps a copy on the phone, erases the account's log and stops syncing. */
  withdraw: () => Promise<void>;
  /** Shows the consent screen again. */
  ask: () => void;
};

// Optional on purpose: only a signed-in account with Plus has consent to give, so it's null otherwise.
const HealthConsentContext = createContext<HealthConsentValue | null>(null);

export const useHealthConsent = () => useContext(HealthConsentContext);

/** Mounted by the account's consent gate, given or declined; the actions come from there. */
export function HealthConsentProvider({
  given,
  withdraw,
  ask,
  children,
}: HealthConsentValue & { children: React.ReactNode }) {
  const value = useMemo(
    () => ({ given, withdraw, ask }),
    [given, withdraw, ask],
  );
  return (
    <HealthConsentContext.Provider value={value}>
      {children}
    </HealthConsentContext.Provider>
  );
}
