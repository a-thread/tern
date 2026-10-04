import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@shared/theme';
import { IconBadge, Row } from '@shared/components/ui';

/** A Settings row that opens how foods are shown (tiers, calories). */
export function FoodDisplayRow({ onPress }: { onPress: () => void }) {
  return (
    <Row
      icon={
        <IconBadge bg={colors.doveTint}>
          <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke={colors.ink2} strokeWidth={2}>
            <Path d='M12 3c-4 3-6 6-6 9a6 6 0 0 0 12 0c0-3-2-6-6-9z' />
          </Svg>
        </IconBadge>
      }
      title='Food display'
      chevron
      onPress={onPress}
    />
  );
}
