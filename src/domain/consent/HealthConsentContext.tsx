import React, { createContext, useContext, useMemo } from 'react';

import type { HealthConsentRecord } from './models/healthConsent';

type HealthConsentValue = {
  given: HealthConsentRecord;
  /** Keeps a copy on the phone, erases the account's log and stops syncing. */
  withdraw: () => Promise<void>;
};

// Optional on purpose: only a syncing account has consent to show, so it's null on the phone.
const HealthConsentContext = createContext<HealthConsentValue | null>(null);

export const useHealthConsent = () => useContext(HealthConsentContext);

/** Mounted by the account backend once consent is given; `withdraw` comes from there. */
export function HealthConsentProvider({
  given,
  withdraw,
  children,
}: HealthConsentValue & { children: React.ReactNode }) {
  const value = useMemo(() => ({ given, withdraw }), [given, withdraw]);
  return (
    <HealthConsentContext.Provider value={value}>
      {children}
    </HealthConsentContext.Provider>
  );
}
