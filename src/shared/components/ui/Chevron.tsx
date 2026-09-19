import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

export function Chevron({ color = colors.ink3 }: { color?: string }) {
  return (
    <Svg width={15} height={15} viewBox='0 0 24 24' fill='none'>
      <Path
        d='M9 6l6 6-6 6'
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap='round'
      />
    </Svg>
  );
}
