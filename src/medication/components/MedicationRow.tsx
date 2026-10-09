import React from 'react';

import { colors } from '@shared/theme';
import { IconBadge, Row, Icon } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';

/** A Settings row for the medications being tracked; tapping it opens the medication list. */
export function MedicationRow({ onPress }: { onPress: () => void }) {
  const { settings } = useSettings();
  const count = settings.medications.length;
  return (
    <Row
      icon={
        <IconBadge bg={colors.violetTint}>
          <Icon name='pill' size={17} color={colors.violet} />
        </IconBadge>
      }
      title='Medication'
      sub={count ? 'Mark each one taken from Today' : 'Optional — track whether you took it'}
      value={count ? String(count) : undefined}
      chevron
      onPress={onPress}
    />
  );
}
