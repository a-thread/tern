import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, font } from '@shared/theme';

type Point = { x: number; y: number };

const DURATION = 1700;
const PARTICLES = 14;
const FEATHER = '#8E7CC3';

/** Cheap deterministic pseudo-random in [0, 1) so a given award always looks the same. */
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Feather() {
  return (
    <Svg width={20} height={20} viewBox='0 0 20 20'>
      <Path d='M3 18C3 8 9 2 18 2C18 10 12 16 4 17Z' fill={FEATHER} />
      <Path d='M3 19L14 7' stroke='#F5F3EE' strokeWidth={1.1} strokeLinecap='round' />
    </Svg>
  );
}

function Sparkle() {
  return (
    <Svg width={20} height={20} viewBox='0 0 20 20'>
      <Path
        d='M10 0L12.2 7.8L20 10L12.2 12.2L10 20L7.8 12.2L0 10L7.8 7.8Z'
        fill={colors.sun}
      />
    </Svg>
  );
}

/**
 * Feathers and sparkles burst out of `origin`, then curve up into `target`
 * (the waypoints chip). Coordinates are relative to this component's
 * container, which should fill the screen. `onArrive` fires as the first
 * wave lands — that's when the caller should let the displayed total tick
 * up — and `onDone` once everything has faded out.
 */
export default function WaypointBurst({
  id,
  points,
  label,
  origin,
  target,
  onArrive,
  onDone,
}: {
  id: number;
  points: number;
  label: string;
  origin: Point;
  target: Point;
  onArrive: () => void;
  onDone: () => void;
}) {
  const t = useRef(new Animated.Value(0)).current;

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => {
        const angle = -Math.PI + (i / (PARTICLES - 1)) * Math.PI + (rand(id + i) - 0.5) * 0.5;
        const radius = 38 + rand(id * 3 + i) * 52;
        return {
          key: i,
          feather: i % 2 === 0,
          burstX: origin.x + Math.cos(angle) * radius,
          burstY: origin.y + Math.sin(angle) * radius - 6,
          delay: rand(id * 7 + i) * 0.22,
          size: 0.8 + rand(id * 5 + i) * 0.55,
          spin: (rand(id * 11 + i) > 0.5 ? 1 : -1) * (140 + rand(id * 13 + i) * 200),
        };
      }),
    [id, origin.x, origin.y],
  );

  useEffect(() => {
    const arrive = setTimeout(onArrive, DURATION * 0.82);
    let done: ReturnType<typeof setTimeout> | undefined;
    Animated.timing(t, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      // Unmounting in the same frame the native animation finishes makes the
      // native side detach nodes it has already dropped ("Animated node with
      // tag [n] does not exist"), so let the last frame land first.
      if (finished) done = setTimeout(onDone, 120);
    });
    return () => {
      clearTimeout(arrive);
      if (done) clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none'>
      {particles.map((p) => {
        const e = p.delay;
        const range = [0, e + 0.001, e + 0.25, e + 0.75];
        return (
          <Animated.View
            key={p.key}
            style={[
              s.particle,
              {
                opacity: t.interpolate({
                  inputRange: [0, e + 0.001, e + 0.6, e + 0.75],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateX: t.interpolate({
                      inputRange: range,
                      outputRange: [origin.x, origin.x, p.burstX, target.x],
                      easing: Easing.out(Easing.quad),
                    }),
                  },
                  {
                    translateY: t.interpolate({
                      inputRange: range,
                      outputRange: [origin.y, origin.y, p.burstY, target.y],
                      easing: Easing.out(Easing.quad),
                    }),
                  },
                  {
                    rotate: t.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${p.spin}deg`],
                    }),
                  },
                  {
                    scale: t.interpolate({
                      inputRange: range,
                      outputRange: [0, p.size, p.size, p.size * 0.35],
                    }),
                  },
                ],
              },
            ]}
          >
            {p.feather ? <Feather /> : <Sparkle />}
          </Animated.View>
        );
      })}

      <Animated.View
        style={[
          s.label,
          {
            left: origin.x - 90,
            top: origin.y - 34,
            opacity: t.interpolate({
              inputRange: [0, 0.06, 0.6, 0.85],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                translateY: t.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -34],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={s.points}>+{points}</Text>
        <Text style={s.reason}>{label}</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  particle: {
    position: 'absolute',
    left: -10,
    top: -10,
    width: 20,
    height: 20,
  },
  label: { position: 'absolute', width: 180, alignItems: 'center' },
  points: {
    fontFamily: font.displayMedium,
    fontSize: 30,
    color: '#FBFAF7',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 6,
  },
  reason: {
    fontFamily: font.semibold,
    fontSize: 11.5,
    color: '#FBFAF7',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 4,
  },
});
