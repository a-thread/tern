import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconBadge, Row, Chip } from '@shared/components/ui';
import { useActivity } from '@today/ActivityContext';
import { StepsStatus } from '@today/data/steps.repository';

/** A Settings row for the step source, badged once Health Connect is connected. */
export function HealthDataRow({ onPress }: { onPress: () => void }) {
  const { status } = useActivity();
  return (
    <Row
      icon={
        <IconBadge bg='#E4EFE6'>
          <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke='#3B6B4A' strokeWidth={2}>
            <Path d='M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z' />
          </Svg>
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
