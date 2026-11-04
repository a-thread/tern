import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { colors } from '../../../theme';

/** How big a splash is: a drink gets a small one, the drink that reaches the goal a big one. */
export class SplashSize {
  static readonly DROPS = 10;
  static readonly BIG_DROPS = 16;
  static readonly SPRAY = 10;
  static readonly BIG_SPRAY = 18;
  static readonly BUBBLES = 6;
  static readonly BIG_BUBBLES = 10;
  static readonly MS = 900;
  static readonly BIG_MS = 1150;
}

/** Points sampled along each arc; enough that the flight and the turn read as smooth curves. */
const STEPS = 10;
const DROP_W = 8;
const DROP_H = 12;
const DROP_COLORS = [colors.water, colors.waterMid, colors.waterMid];
const SPRAY_COLORS = [colors.waterMid, colors.waterLight];

/** A drop's flight, sampled at each step: where it is, which way it points and how stretched it is. */
type Flight = {
  xs: number[];
  ys: number[];
  turns: string[];
  stretch: number[];
};
type Drop = Flight & { size: number; color: string };
type Bubble = { xs: number[]; ys: number[]; r: number; start: number };

const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const STEP_INPUT = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);

/**
 * A drop thrown up from the button: it flies a parabola under gravity, its tip trailing the way
 * it moves (so it tips over at the top and falls tip-up), and it stretches while it is fast.
 */
function fly(speed: number, spread: number, gravity: number): Flight {
  const angle = -Math.PI / 2 + between(-spread, spread);
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const xs: number[] = [];
  const ys: number[] = [];
  const turns: string[] = [];
  const stretch: number[] = [];
  let last = 0;
  for (const t of STEP_INPUT) {
    const dy = vy + 2 * gravity * t; // the velocity now: gravity pulls it round
    xs.push(vx * t);
    ys.push(vy * t + gravity * t * t);
    // The drawing points its tip up (0, -1); turn the tip to face away from the motion.
    let deg = (Math.atan2(-dy, -vx) * 180) / Math.PI + 90;
    while (deg - last > 180) deg -= 360; // keep turning the short way, no spin at the wrap
    while (deg - last < -180) deg += 360;
    last = deg;
    turns.push(`${deg.toFixed(1)}deg`);
    // Only a touch longer while fast, so a drop keeps its shape instead of smearing out.
    stretch.push(0.92 + 0.18 * Math.min(1, Math.hypot(vx, dy) / speed));
  }
  return { xs, ys, turns, stretch };
}

function makeDrops(count: number, big: boolean): Drop[] {
  return Array.from({ length: count }, (_, i) => ({
    ...fly(between(105, big ? 175 : 150), 0.75, between(200, 250)),
    size: between(0.6, 0.95),
    color: DROP_COLORS[i % DROP_COLORS.length],
  }));
}

/** Fine spray: tiny drops thrown faster and wider than the main ones. */
function makeSpray(count: number, big: boolean): Drop[] {
  return Array.from({ length: count }, (_, i) => ({
    ...fly(between(120, big ? 200 : 170), 1.05, between(230, 280)),
    size: between(1.6, 3),
    color: SPRAY_COLORS[i % SPRAY_COLORS.length],
  }));
}

/** Small clear bubbles that wobble up out of the splash and pop; they stay small, not swelling. */
function makeBubbles(count: number, big: boolean): Bubble[] {
  return Array.from({ length: count }, () => {
    const drift = between(-20, 20);
    const rise = between(28, big ? 64 : 50);
    const wobble = between(2, 4);
    const turns = between(1.5, 2.5);
    return {
      xs: STEP_INPUT.map(
        (t) => drift * t + Math.sin(t * Math.PI * 2 * turns) * wobble,
      ),
      // Quick off the mark, easing as it nears the top.
      ys: STEP_INPUT.map((t) => -rise * (1 - (1 - t) * (1 - t))),
      r: between(1.6, 3.4),
      start: between(0.05, 0.3),
    };
  });
}

/**
 * One splash of water at (`x`, `y`) in its layer: a flat ripple, drops thrown up
 * that arc over and fall, a fine spray and small bubbles that rise and pop. `onDone` fires once it has faded.
 */
export function WaterSplash({
  x,
  y,
  big,
  onDone,
}: {
  x: number;
  y: number;
  big: boolean;
  onDone: () => void;
}) {
  const t = useRef(new Animated.Value(0)).current;
  const drops = useMemo(
    () => makeDrops(big ? SplashSize.BIG_DROPS : SplashSize.DROPS, big),
    [big],
  );
  const spray = useMemo(
    () => makeSpray(big ? SplashSize.BIG_SPRAY : SplashSize.SPRAY, big),
    [big],
  );
  const bubbles = useMemo(
    () => makeBubbles(big ? SplashSize.BIG_BUBBLES : SplashSize.BUBBLES, big),
    [big],
  );

  useEffect(() => {
    let done: ReturnType<typeof setTimeout> | undefined;
    Animated.timing(t, {
      toValue: 1,
      duration: big ? SplashSize.BIG_MS : SplashSize.MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Unmounting in the frame a native animation ends can drop nodes it still holds.
      if (finished) done = setTimeout(onDone, 60);
    });
    return () => {
      t.stopAnimation();
      if (done) clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fade = t.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 1, 0],
  });
  const along = (values: number[] | string[]) =>
    t.interpolate({ inputRange: STEP_INPUT, outputRange: values });

  return (
    <View style={[s.origin, { left: x, top: y }]} pointerEvents='none'>
      {/* Flattened, so it reads as a ripple spreading on a water surface. */}
      <Animated.View
        style={[
          s.ripple,
          {
            opacity: t.interpolate({
              inputRange: [0, 0.55],
              outputRange: [0.55, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              { scaleY: 0.4 },
              {
                scale: t.interpolate({
                  inputRange: [0, 0.55],
                  outputRange: [0.5, big ? 2.8 : 2.1],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      />

      {spray.map((d, i) => (
        <Animated.View
          key={`s${i}`}
          style={[
            s.spray,
            {
              width: d.size,
              height: d.size,
              borderRadius: d.size / 2,
              left: -d.size / 2,
              top: -d.size / 2,
              backgroundColor: d.color,
              opacity: fade,
              transform: [
                { translateX: along(d.xs) },
                { translateY: along(d.ys) },
              ],
            },
          ]}
        />
      ))}

      {bubbles.map((b, i) => {
        const popAt = b.start + (1 - b.start) * 0.88;
        const box = b.r * 2 + 2;
        return (
          <Animated.View
            key={`b${i}`}
            style={[
              s.bubble,
              { width: box, height: box, left: -box / 2, top: -box / 2 },
              {
                opacity: t.interpolate({
                  inputRange: [0, b.start, b.start + 0.06, popAt, 1],
                  outputRange: [0, 0, 0.9, 0.9, 0],
                }),
                transform: [
                  { translateX: along(b.xs) },
                  { translateY: along(b.ys) },
                  {
                    // Steady as it rises, then a quick small pop rather than a swell.
                    scale: t.interpolate({
                      inputRange: [0, b.start, b.start + 0.1, popAt, 1],
                      outputRange: [0.5, 0.5, 1, 1, 1.25],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={box} height={box}>
              <Circle
                cx={box / 2}
                cy={box / 2}
                r={b.r}
                fill='none'
                stroke={colors.waterMid}
                strokeWidth={1}
              />
              <Circle
                cx={box / 2 - b.r * 0.35}
                cy={box / 2 - b.r * 0.35}
                r={Math.max(0.6, b.r * 0.22)}
                fill={colors.waterLight}
              />
            </Svg>
          </Animated.View>
        );
      })}

      {drops.map((d, i) => (
        <Animated.View
          key={`d${i}`}
          style={[
            s.drop,
            {
              opacity: fade,
              transform: [
                { translateX: along(d.xs) },
                { translateY: along(d.ys) },
                { rotate: along(d.turns) },
                // Stretched along the way it flies, rounder at the top of the arc.
                { scaleY: along(d.stretch.map((k) => k * d.size)) },
                {
                  scaleX: t.interpolate({
                    inputRange: [0, 0.08, 1],
                    outputRange: [0.2, d.size, d.size * 0.8],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg width={DROP_W} height={DROP_H} viewBox='0 0 8 12'>
            <Path
              d='M4 0C4 0 0 5.6 0 8a4 4 0 0 0 8 0C8 5.6 4 0 4 0Z'
              fill={d.color}
              fillOpacity={0.9}
            />
            {/* A sliver of light down one side, the way a real drop catches it. */}
            <Ellipse
              cx={2.6}
              cy={8}
              rx={0.8}
              ry={1.7}
              fill={colors.card}
              fillOpacity={0.55}
            />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  origin: { position: 'absolute', width: 0, height: 0 },
  ripple: {
    position: 'absolute',
    left: -16,
    top: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.waterMid,
  },
  drop: {
    position: 'absolute',
    left: -DROP_W / 2,
    top: -DROP_H / 2,
    width: DROP_W,
    height: DROP_H,
  },
  spray: { position: 'absolute' },
  bubble: { position: 'absolute' },
});
