import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@shared/theme';
import { IconBadge } from '@shared/components/ui';

/** A small green tick for the things already done today. */
export function DoneBadge() {
  return (
    <IconBadge bg={colors.kelpTint}>
      <Svg width={14} height={14} viewBox='0 0 24 24' fill='none'>
        <Path
          d='M5 12.5l4.5 4.5L19 7.5'
          stroke={colors.kelp}
          strokeWidth={2.4}
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </Svg>
    </IconBadge>
  );
}
