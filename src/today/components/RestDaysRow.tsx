import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@shared/theme';
import { IconBadge, Row } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';

/** A Settings row showing the weekly rest-day allowance; tapping it opens the rest-days screen. */
export function RestDaysRow({ onPress }: { onPress: () => void }) {
  const { settings } = useSettings();
  return (
    <Row
      icon={
        <IconBadge bg={colors.driftwoodTint}>
          <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke={colors.driftwood} strokeWidth={2}>
            <Path d='M4 18h16M6 18v-3a6 6 0 0 1 12 0v3' />
          </Svg>
        </IconBadge>
      }
      title='Rest days'
      sub={`${settings.restDaysPerWeek} per week, streak protected`}
      chevron
      onPress={onPress}
    />
  );
}
