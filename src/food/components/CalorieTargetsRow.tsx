import React from 'react';

import { colors } from '@shared/theme';
import { IconBadge, Row, Icon } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';

/** A Settings row showing the calorie target; tapping it opens the calorie and macro targets. */
export function CalorieTargetsRow({ onPress }: { onPress: () => void }) {
  const { settings } = useSettings();
  return (
    <Row
      icon={
        <IconBadge bg={colors.waterTint}>
          <Icon name='target' size={17} color={colors.water} />
        </IconBadge>
      }
      title='Calorie & macro targets'
      value={settings.trackCalories ? settings.calorieTarget.toLocaleString() : 'Off'}
      chevron
      onPress={onPress}
    />
  );
}
