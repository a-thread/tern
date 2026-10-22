import React from 'react';

import { FootNote, GroupLabel } from '@shared/components/ui';
import { useData } from '@/domain/settings/DataContext';
import { SettingsPage } from '../components/SettingsPage';
import { DataSection } from './components/DataSection';
import { PlusSection } from './components/PlusSection/PlusSection';

/**
 * Settings › Your data: where it is (Tern Plus, synced or on this phone) at the top, then
 * export, restore and delete.
 */
export default function DataSettingsScreen() {
  const { available } = useData();
  return (
    <SettingsPage title='Your data'>
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
