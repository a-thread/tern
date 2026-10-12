import React from 'react';

import { FootNote } from '@/shared/components/ui';
import { useBackend } from '@/BackendContext';
import { SettingsPage } from '@/settings/components/SettingsPage';
import { DataSection } from '@/settings/data/components/DataSection';

/** Settings › Your data: export it, or delete it and the account. Only reachable when signed in. */
export default function DataSettingsScreen() {
  const { data } = useBackend();
  return (
    <SettingsPage title='Your data'>
      {data ? (
        <DataSection repo={data} />
      ) : (
        <FootNote>Nothing is stored in preview.</FootNote>
      )}
    </SettingsPage>
  );
}
