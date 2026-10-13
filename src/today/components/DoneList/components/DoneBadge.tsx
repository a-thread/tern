import React from 'react';

import { colors } from '@shared/theme';
import { IconBadge, Icon } from '@shared/components/ui';

/** A small green tick for the things already done today. */
export function DoneBadge() {
  return (
    <IconBadge bg={colors.kelpTint}>
      <Icon name='check' size={16} color={colors.kelp} />
    </IconBadge>
  );
}
