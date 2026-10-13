import React from 'react';

import { colors } from '@shared/theme';
import { IconBadge, Row, Icon } from '@shared/components/ui';

/** A Settings row that opens how foods are shown (tiers, calories). */
export function FoodDisplayRow({ onPress }: { onPress: () => void }) {
  return (
    <Row
      icon={
        <IconBadge bg={colors.doveTint}>
          <Icon name='eye-outline' size={17} color={colors.ink2} />
        </IconBadge>
      }
      title='Food display'
      chevron
      onPress={onPress}
    />
  );
}
