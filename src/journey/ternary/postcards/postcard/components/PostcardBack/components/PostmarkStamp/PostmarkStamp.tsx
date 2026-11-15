import React from 'react';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { font, postcardColors } from '@shared/theme';
import { postmarkLines } from './utils/postmark';

const SIZE = 78;
const C = SIZE / 2;

/**
 * A postcard's postmark: the place in a double ring, with cancel lines running onto the stamp.
 * Never a date, so a postcard never says when someone got there.
 */
export function PostmarkStamp({ place }: { place: string }) {
  const lines = postmarkLines(place);
  // Centred as a block: 9 points a line.
  const top = C - ((lines.length - 1) * 9) / 2 + 3;
  return (
    <Svg
      width={SIZE + 22}
      height={SIZE}
      viewBox={`0 0 ${SIZE + 22} ${SIZE}`}
      style={{ marginRight: -26, marginTop: 14, zIndex: 2 }}
      accessibilityLabel={`Postmark: ${place}`}
    >
      <Circle
        cx={C}
        cy={C}
        r={33}
        fill='none'
        stroke={postcardColors.postmark}
        strokeWidth={2}
      />
      <Circle
        cx={C}
        cy={C}
        r={25}
        fill='none'
        stroke={postcardColors.postmark}
        strokeWidth={1}
      />
      {lines.map((line, i) => (
        <SvgText
          key={line}
          x={C}
          y={top + i * 9}
          textAnchor='middle'
          fontFamily={font.bold}
          fontSize={line.length > 8 ? 6.5 : 7.5}
          letterSpacing={0.6}
          fill={postcardColors.postmark}
        >
          {line}
        </SvgText>
      ))}
      {[26, 39, 52].map((y) => (
        <Path
          key={y}
          d={`M70 ${y} C 78 ${y - 4}, 86 ${y + 4}, 96 ${y}`}
          fill='none'
          stroke={postcardColors.postmark}
          strokeWidth={1.6}
        />
      ))}
    </Svg>
  );
}
