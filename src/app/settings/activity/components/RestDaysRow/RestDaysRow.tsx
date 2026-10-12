import React from 'react';

import { colors } from '@/shared/theme';
import { IconBadge, Row } from '@/shared/components/ui/Layout';
import { Icon } from '@/shared/components/ui/Icon';
import { useSettings } from '@/domain/settings/SettingsContext';

/** A Settings row showing the weekly rest-day allowance; tapping it opens the rest-days screen. */
export function RestDaysRow({ onPress }: { onPress: () => void }) {
  const { settings } = useSettings();
  return (
    <Row
      icon={
        <IconBadge bg={colors.driftwoodTint}>
          <Icon name='weather-sunset' size={17} color={colors.driftwood} />
        </IconBadge>
      }
      title='Rest days'
      sub={`${settings.restDaysPerWeek} per week, streak protected`}
      chevron
      onPress={onPress}
    />
  );
}
