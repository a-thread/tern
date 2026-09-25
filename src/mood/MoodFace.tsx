import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@shared/theme';
import { mix } from './scoreColor';

/** A simple face whose mouth follows `smile` (-1 frown, 0 flat, 1 smile), tinted with `color`. */
export default function MoodFace({
  smile,
  color,
  size = 84,
}: {
  smile: number;
  color: string;
  size?: number;
}) {
  const s = Math.min(Math.max(Number.isFinite(smile) ? smile : 0, -1), 1);
  const mouthY = 58 + s * 12; // the mouth's control point: below the ends smiles, above frowns
  return (
    <Svg width={size} height={size} viewBox='0 0 88 88' accessibilityElementsHidden>
      <Circle cx={44} cy={44} r={40} fill={mix(color, '#FFFFFF', 0.7)} stroke={color} strokeWidth={3} />
      <Circle cx={31} cy={36} r={3.6} fill={colors.ink} />
      <Circle cx={57} cy={36} r={3.6} fill={colors.ink} />
      <Path
        d={`M28 56 Q44 ${mouthY} 60 56`}
        stroke={colors.ink}
        strokeWidth={3.4}
        strokeLinecap='round'
        fill='none'
      />
    </Svg>
  );
}
