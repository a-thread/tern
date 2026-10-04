import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@shared/theme';
import { IconBadge, Row } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';

/** A Settings row showing the daily step goal; tapping it opens the goal screen. */
export function StepGoalRow({ onPress }: { onPress: () => void }) {
  const { settings } = useSettings();
  return (
    <Row
      icon={
        <IconBadge bg={colors.coralTint}>
          <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke={colors.coral} strokeWidth={2}>
            <Path d='M5 21V4M5 4h11l-2 3 2 3H5' />
          </Svg>
        </IconBadge>
      }
      title='Daily step goal'
      value={settings.stepGoal.toLocaleString()}
      chevron
      onPress={onPress}
    />
  );
}
