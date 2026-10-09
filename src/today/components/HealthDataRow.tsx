import React from 'react';

import { IconBadge, Row, Chip, Icon } from '@shared/components/ui';
import { useActivity } from '@today/ActivityContext';
import { StepsStatus } from '@today/data/steps.repository';

/** A Settings row for the step source, badged once Health Connect is connected. */
export function HealthDataRow({ onPress }: { onPress: () => void }) {
  const { status } = useActivity();
  return (
    <Row
      icon={
        <IconBadge bg='#E4EFE6'>
          <Icon name='heart-pulse' size={17} color='#3B6B4A' />
        </IconBadge>
      }
      title='Health data'
      sub='Steps sync automatically'
      right={
        status === StepsStatus.Connected ? (
          <Chip bg='#E4EFE6' color='#3B6B4A'>
            Connected
          </Chip>
        ) : undefined
      }
      chevron
      onPress={onPress}
    />
  );
}
