import React from 'react';

import { FootNote, GroupLabel } from '@shared/components/ui';
import { useData } from '@/domain/settings/DataContext';
import { useAuth } from '@/domain/auth/AuthContext';
import { SettingsPage } from '../components/SettingsPage';
import { DataSection } from './components/DataSection';
import { PlusSection } from './components/PlusSection/PlusSection';
import { LogOutSection } from './components/LogOutSection/LogOutSection';
import { AppointmentSummary } from './components/AppointmentSummary/AppointmentSummary';
import { ConsentSection } from './components/ConsentSection/ConsentSection';
import { useHealthConsent } from '@/domain/consent/HealthConsentContext';

export default function DataSettingsScreen() {
  const { available } = useData();
  // Signed in, it's reached from the profile card and holds the account too (Delete my account).
  const signedIn = Boolean(useAuth()?.session);
  const consent = useHealthConsent();
  return (
    <SettingsPage title={signedIn ? 'Account and data' : 'Your data'}>
      {available ? (
        <>
          <PlusSection />
          <GroupLabel>For an appointment</GroupLabel>
          <AppointmentSummary />
          <GroupLabel>Export and delete</GroupLabel>
          <DataSection />
          {consent ? (
            <>
              <GroupLabel>Health data consent</GroupLabel>
              <ConsentSection />
            </>
          ) : null}
        </>
      ) : (
        <FootNote>
          Sample data isn't stored, so there's nothing to export.
        </FootNote>
      )}
      <LogOutSection />
    </SettingsPage>
  );
}
