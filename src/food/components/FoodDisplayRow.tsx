import React from 'react';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@shared/theme';
import { IconBadge, Row } from '@shared/components/ui';

/** A Settings row that opens how foods are shown (tiers, calories). */
export function FoodDisplayRow({ onPress }: { onPress: () => void }) {
  return (
    <Row
      icon={
        <IconBadge bg={colors.doveTint}>
          <Svg width={15} height={15} viewBox='0 0 24 24' fill='none' stroke={colors.ink2} strokeWidth={2}>
            <Circle cx={12} cy={12} r={9} />
            <Circle cx={12} cy={12} r={4.5} />
          </Svg>
        </IconBadge>
      }
      title='Food display'
      chevron
      onPress={onPress}
    />
  );
}
