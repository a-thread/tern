import React from 'react';

import { FootNote, GroupLabel } from '@shared/components/ui';
import { useData } from '@/domain/settings/DataContext';
import { useAuth } from '@/domain/auth/AuthContext';
import { SettingsPage } from '../components/SettingsPage';
import { DataSection } from './components/DataSection';
import { PlusSection } from './components/PlusSection/PlusSection';

/**
 * Settings › Your data: where it is (Tern Plus, synced or on this phone) at the top, then
 * export, restore and delete.
 */
export default function DataSettingsScreen() {
  const { available } = useData();
  // Signed in, it's reached from the profile card and holds the account too (Delete my account).
  const signedIn = Boolean(useAuth()?.session);
  return (
    <SettingsPage title={signedIn ? 'Account and data' : 'Your data'}>
      {available ? (
        <>
          <PlusSection />
          <GroupLabel>Export and delete</GroupLabel>
          <DataSection />
        </>
      ) : (
        <FootNote>Sample data isn't stored, so there's nothing to export.</FootNote>
      )}
    </SettingsPage>
  );
}
