import React from 'react';

import { ToggleRow } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';

/** Turns the check-in after meals on or off. Off by default, so it stays out of the way. */
export function MealCheckInToggleRow() {
  const { settings, updateSettings } = useSettings();
  return (
    <ToggleRow
      title='Check in after meals'
      sub='A quick note on how full you are and how you feel'
      on={settings.checkInAfterMeals}
      onToggle={(v) => updateSettings({ checkInAfterMeals: v })}
    />
  );
}
