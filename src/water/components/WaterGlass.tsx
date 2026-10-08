import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { ClipPath, Circle, Defs, Path } from 'react-native-svg';

import { colors } from '@shared/theme';

const W = 200;
const H = 190;
const TOP = 22;
const BOTTOM = 177;
const GLASS =
  'M62 22h76l-8 146a10 10 0 0 1-10 9H80a10 10 0 0 1-10-9z';
const WAVE_LENGTH = 60;
const RISE_MS = 850;
const SLOSH_MS = 2000;
/** How far the surface can lean at the start of a pour, in svg units either side of centre. */
const MAX_TILT = 15;
const MAX_AMPLITUDE = 6;
/** Wave crests that scroll past during one pour (the scroll slows as the water settles). */
const SCROLL_TURNS = 3;

/** Bubbles resting in the water, and extra ones that stream up during a pour. */
const BUBBLES = [
  { x: 90, y: BOTTOM - 28, r: 3 },
  { x: 112, y: BOTTOM - 52, r: 2 },
  { x: 100, y: BOTTOM - 12, r: 2.5 },
];
const RISERS = [
  { x: 84, r: 2 },
  { x: 100, r: 3 },
  { x: 116, r: 2.2 },
  { x: 94, r: 1.6 },
];

/** The surface: a wave across the glass, leaned by `tilt`, filled down to the base. */
function surfacePath(y: number, phase: number, amplitude: number, tilt: number) {
  let d = `M ${-WAVE_LENGTH} ${BOTTOM + 20}`;
  for (let x = -WAVE_LENGTH; x <= W + WAVE_LENGTH; x += 6) {
    const wave = Math.sin(((x + phase * WAVE_LENGTH) / WAVE_LENGTH) * Math.PI * 2);
    const lean = (tilt * (x - W / 2)) / 50;
    d += ` L ${x} ${(y + lean + wave * amplitude).toFixed(2)}`;
  }
  return `${d} L ${W + WAVE_LENGTH} ${BOTTOM + 20} Z`;
}

/**
 * A large glass that fills as water is logged. It is still at rest; when the
 * level changes the surface rises, the waves rush across and the water sloshes
 * from side to side before settling flat again. `progress` is 0 to 1 toward the
 * goal; going past it just keeps the glass full.
 */
export default function WaterGlass({
  progress,
  pourKey,
}: {
  progress: number;
  /** Changes whenever water is added or removed, so the glass sloshes even when it is already full. */
  pourKey: number;
}) {
  const target = Math.min(Math.max(progress, 0), 1);
  const level = useRef(new Animated.Value(target)).current;
  // 0 at the start of a pour, 1 once the water has settled.
  const pour = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  const [shownLevel, setShownLevel] = useState(target);
  const [t, setT] = useState(1);

  useEffect(() => {
    const levelId = level.addListener(({ value }) => setShownLevel(value));
    const pourId = pour.addListener(({ value }) => setT(value));
    return () => {
      level.removeListener(levelId);
      pour.removeListener(pourId);
    };
  }, [level, pour]);

  useEffect(() => {
    // Opening the sheet shows the glass as it is, with no pour.
    if (first.current) {
      first.current = false;
      return;
    }
    pour.setValue(0);
    Animated.parallel([
      Animated.timing(level, {
        toValue: target,
        duration: RISE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(pour, {
        toValue: 1,
        duration: SLOSH_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ]).start();
  }, [target, pourKey, level, pour]);

  // Energy fades to zero, so the surface is perfectly flat at rest.
  const energy = Math.pow(1 - t, 1.6);
  const amplitude = energy * MAX_AMPLITUDE;
  const tilt = energy * MAX_TILT * Math.sin(t * Math.PI * 5);
  // Scroll fast at first, then ease to a stop.
  const phase = (1 - Math.pow(1 - t, 3)) * SCROLL_TURNS;

  const surface = BOTTOM - shownLevel * (BOTTOM - TOP - 6);
  const hasWater = shownLevel >= 0.02;

  return (
    <Svg
      viewBox={`0 0 ${W} ${H}`}
      width='100%'
      height={170}
      accessibilityRole='image'
      accessibilityLabel={`Glass ${Math.round(target * 100)} percent full`}
    >
      <Defs>
        <ClipPath id='glassClip'>
          <Path d={GLASS} />
        </ClipPath>
      </Defs>
      <Path d={GLASS} fill={colors.waterTint} />
      {hasWater ? (
        <>
          <Path
            clipPath='url(#glassClip)'
            d={surfacePath(surface + 5, phase + 0.35, amplitude, tilt * 0.8)}
            fill={colors.waterLight}
          />
          <Path
            clipPath='url(#glassClip)'
            d={surfacePath(surface, phase, amplitude, tilt)}
            fill={colors.waterMid}
          />
          {BUBBLES.map((b, i) => {
            // Bubbles swing with the slosh, lift a little as the water churns, then settle back.
            const x = b.x + Math.sin(t * Math.PI * 5 + i * 1.3) * energy * 11;
            const y = b.y - energy * (6 + i * 4);
            // Never above the surface: a bubble only exists in the water.
            if (y - b.r < surface + 4) return null;
            return <Circle key={i} cx={x} cy={y} r={b.r} fill='#fff' opacity={0.5} />;
          })}
          {RISERS.map((b, i) => {
            // Extra bubbles that only appear while pouring, streaming up from the base.
            const rise = Math.min(1, t * 1.4 + i * 0.18);
            const y = BOTTOM - 14 - rise * (BOTTOM - 14 - surface - 8);
            const x = b.x + Math.sin(t * Math.PI * 6 + i * 2) * 6 * energy;
            if (y < surface + 6 || energy < 0.03) return null;
            return (
              <Circle key={`r${i}`} cx={x} cy={y} r={b.r} fill='#fff' opacity={0.55 * Math.min(1, energy * 2)} />
            );
          })}
        </>
      ) : null}
      <Path d={GLASS} fill='none' stroke={colors.waterLight} strokeWidth={3} />
    </Svg>
  );
}
