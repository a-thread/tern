import React from 'react';

import { FootNote } from '@shared/components/ui';
import { useData } from '@/domain/settings/DataContext';
import { SettingsPage } from '../components/SettingsPage';
import { DataSection } from './components/DataSection';

/** Settings › Your data: export it, or delete it and the account. Only reachable when signed in. */
export default function DataSettingsScreen() {
  const { available } = useData();
  return (
    <SettingsPage title='Your data'>
      {available ? (
        <DataSection />
      ) : (
        <FootNote>Nothing is stored in preview.</FootNote>
      )}
    </SettingsPage>
  );
}
