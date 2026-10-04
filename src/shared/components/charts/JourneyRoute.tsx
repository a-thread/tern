import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '@shared/theme';
import { AnimatedPath } from './FlightPath';

/* ------------------------------------------------------------------ */
/* Journey route                                                        */
/* ------------------------------------------------------------------ */

const JOURNEY_LEN = 273; // measured arc length of the path below

export function JourneyRoute({
  progress,
  replayKey = 0,
}: {
  progress: number;
  replayKey?: number;
}) {
  const path = 'M6,34 C 48,34 58,9 104,9 S 172,30 206,17 S 254,11 272,7';
  const dash = useRef(new Animated.Value(JOURNEY_LEN)).current;

  useEffect(() => {
    dash.setValue(JOURNEY_LEN);
    Animated.timing(dash, {
      toValue: JOURNEY_LEN * (1 - Math.min(progress, 1)),
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, replayKey, dash]);

  return (
    <Svg width='100%' height={46} viewBox='0 0 280 46'>
      <Path
        d={path}
        fill='none'
        stroke='rgba(255,255,255,0.2)'
        strokeWidth={2}
        strokeLinecap='round'
      />
      <AnimatedPath
        d={path}
        fill='none'
        stroke='#8FD9C4'
        strokeWidth={2}
        strokeLinecap='round'
        strokeDasharray={JOURNEY_LEN}
        strokeDashoffset={dash as unknown as number}
      />
      <Circle cx={6} cy={34} r={2.6} fill='#8FD9C4' />
      <Circle cx={104} cy={9} r={2.6} fill='#8FD9C4' />
      <Circle cx={206} cy={17} r={3.6} fill={colors.sun} />
      <Circle
        cx={272}
        cy={7}
        r={2.6}
        fill='none'
        stroke='rgba(255,255,255,0.5)'
        strokeWidth={1.6}
      />
    </Svg>
  );
}