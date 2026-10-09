import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { Milestones } from '@journey/models/milestone';
import { GOLD } from './PopupCard';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const W = 240;
const H = 46;
const PAD = 8;
const SAMPLES = 60;

/** A point on the strip's gentle S for a place 0 to 1 along one migration. */
function pointAt(f: number) {
  return {
    x: PAD + f * (W - PAD * 2),
    y: H / 2 + 11 * Math.sin(f * Math.PI * 2.5 + 0.6),
  };
}

/** The S as a path, from `a` to `b` along the migration. */
function pathBetween(a: number, b: number): string {
  if (b <= a) return '';
  const n = Math.max(2, Math.round(SAMPLES * (b - a)));
  return Array.from({ length: n + 1 }, (_, i) => {
    const p = pointAt(a + ((b - a) * i) / n);
    return `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ');
}

/**
 * One migration as a small strip: every stop as a dot, and the bird flying from the stop
 * before (`from`, 0 to 1) to the one just reached (`to`), drawing its trail. The new stop
 * pops when the bird lands. Starts after `delay` ms; with reduce motion on, it's already there.
 */
export function RouteStrip({ from, to, delay = 0 }: { from: number; to: number; delay?: number }) {
  const still = useReduceMotion();
  const [t, setT] = useState(still ? 1 : 0);
  const pop = useRef(new Animated.Value(still ? 1 : 0)).current;
  const stops = useMemo(() => Milestones.STOPS.map((s) => s.waypoints / Milestones.MIGRATION_LENGTH), []);

  useEffect(() => {
    if (still) {
      setT(1);
      pop.setValue(1);
      return;
    }
    const progress = new Animated.Value(0);
    const id = progress.addListener(({ value }) => setT(value));
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.spring(pop, { toValue: 1, friction: 3, tension: 160, useNativeDriver: false }),
    ]);
    anim.start();
    return () => {
      anim.stop();
      progress.removeListener(id);
    };
  }, [still, delay, pop]);

  const at = from + (to - from) * t;
  const bird = pointAt(at);
  const ahead = pointAt(Math.min(at + 0.01, 1));
  const angle = (Math.atan2(ahead.y - bird.y, ahead.x - bird.x) * 180) / Math.PI;
  const landed = pointAt(to);

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 14 }} accessibilityLabel='The route so far'>
      <Path d={pathBetween(0, 1)} stroke='rgba(255,255,255,0.22)' strokeWidth={2} strokeDasharray='3 4' fill='none' />
      <Path d={pathBetween(0, at)} stroke={GOLD} strokeWidth={2.4} strokeLinecap='round' fill='none' />
      <Circle cx={pointAt(0).x} cy={pointAt(0).y} r={3} fill={GOLD} />
      {stops.map((f) =>
        Math.abs(f - to) < 1e-6 ? null : (
          <Circle
            key={f}
            cx={pointAt(f).x}
            cy={pointAt(f).y}
            r={3}
            fill={f < to ? GOLD : 'rgba(255,255,255,0.35)'}
          />
        ),
      )}
      {/* The stop just reached: grey until the bird lands, then a gold pop. */}
      <Circle cx={landed.x} cy={landed.y} r={4} fill='rgba(255,255,255,0.35)' />
      <AnimatedCircle
        cx={landed.x}
        cy={landed.y}
        r={pop.interpolate({ inputRange: [0, 1], outputRange: [0, 5] })}
        fill={GOLD}
      />
      <G transform={`translate(${bird.x} ${bird.y}) rotate(${angle})`}>
        <Path d='M-7 0 L0 -3.2 L7 0 L0 -1 Z' fill='#FBFAF7' />
      </G>
    </Svg>
  );
}
