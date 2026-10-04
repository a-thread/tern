import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@shared/theme';
import { IconBadge, Row } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';

/** A Settings row showing the calorie target; tapping it opens the calorie and macro targets. */
export function CalorieTargetsRow({ onPress }: { onPress: () => void }) {
  const { settings } = useSettings();
  return (
    <Row
      icon={
        <IconBadge bg={colors.waterTint}>
          <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke={colors.water} strokeWidth={2}>
            <Path d='M4 19V9m6 10V4m6 15v-6' />
          </Svg>
        </IconBadge>
      }
      title='Calorie & macro targets'
      value={settings.trackCalories ? settings.calorieTarget.toLocaleString() : 'Off'}
      chevron
      onPress={onPress}
    />
  );
}
