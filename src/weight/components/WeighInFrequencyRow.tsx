import React from 'react';

import { PillToggle, Row } from '@shared/components/ui';
import { Frequency } from '@shared/models/frequency';
import { useSettings } from '@settings/SettingsContext';

const FREQUENCIES = [Frequency.Daily, Frequency.Weekly];

/** How often Today asks for a weigh-in (the weigh-in reminder follows it). */
export function WeighInFrequencyRow() {
  const { settings, updateSettings } = useSettings();
  return (
    <Row
      title='How often'
      sub={
        settings.weighInFrequency === Frequency.Daily
          ? 'Today asks for a weight every day'
          : 'Today asks once a week'
      }
      right={
        <PillToggle
          options={FREQUENCIES}
          value={settings.weighInFrequency}
          onChange={(f) => updateSettings({ weighInFrequency: f })}
          label={(f) => (f === Frequency.Daily ? 'Daily' : 'Weekly')}
        />
      }
    />
  );
}
