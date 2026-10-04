import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@shared/theme';
import { IconBadge, Row } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';

/** A Settings row for the medications being tracked; tapping it opens the medication list. */
export function MedicationRow({ onPress }: { onPress: () => void }) {
  const { settings } = useSettings();
  const count = settings.medications.length;
  return (
    <Row
      icon={
        <IconBadge bg={colors.violetTint}>
          <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke={colors.violet} strokeWidth={2}>
            <Path d='M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7zM8.5 8.5l7 7' />
          </Svg>
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
