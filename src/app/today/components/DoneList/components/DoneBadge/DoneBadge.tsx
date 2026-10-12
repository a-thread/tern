import React from 'react';

import { colors } from '@/shared/theme';
import { IconBadge } from '@/shared/components/ui/Layout';
import { Icon } from '@/shared/components/ui/Icon';

/** A small green tick for the things already done today. */
export function DoneBadge() {
  return (
    <IconBadge bg={colors.kelpTint}>
      <Icon name='check' size={16} color={colors.kelp} />
    </IconBadge>
  );
}
