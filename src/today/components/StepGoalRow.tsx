import React from 'react';

import { colors } from '@shared/theme';
import { IconBadge, Row, Icon } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';

/** A Settings row showing the daily step goal; tapping it opens the goal screen. */
export function StepGoalRow({ onPress }: { onPress: () => void }) {
  const { settings } = useSettings();
  return (
    <Row
      icon={
        <IconBadge bg={colors.coralTint}>
          <Icon name='flag-outline' size={17} color={colors.coral} />
        </IconBadge>
      }
      title='Daily step goal'
      value={settings.stepGoal.toLocaleString()}
      chevron
      onPress={onPress}
    />
  );
}
