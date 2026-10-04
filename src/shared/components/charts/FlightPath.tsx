import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { colors } from '@shared/theme';
import { TERN_PATH } from '@shared/components/TernMark';

export const AnimatedPath = Animated.createAnimatedComponent(Path);

/* ------------------------------------------------------------------ */
/* Flight path — draws itself toward the goal on mount                  */
/* ------------------------------------------------------------------ */

const TRAIL = 'M4,42 C 58,42 54,13 112,13 S 186,40 232,26';

// The trail's two cubic segments, sampled once into an arc-length lookup
// table so the bird can sit exactly on the drawn line at any progress.
const TRAIL_SEGMENTS: [number, number][][] = [
  [
    [4, 42],
    [58, 42],
    [54, 13],
    [112, 13],
  ],
  [
    [112, 13],
    [170, 13],
    [186, 40],
    [232, 26],
  ],
];

const TRAIL_POINTS: { x: number; y: number; len: number }[] = (() => {
  const pts: { x: number; y: number; len: number }[] = [];
  let len = 0;
  const STEPS = 100;
  TRAIL_SEGMENTS.forEach(([p0, p1, p2, p3], si) => {
    for (let i = si === 0 ? 0 : 1; i <= STEPS; i++) {
      const t = i / STEPS;
      const u = 1 - t;
      const x =
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const y =
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
      const prev = pts[pts.length - 1];
      if (prev) len += Math.hypot(x - prev.x, y - prev.y);
      pts.push({ x, y, len });
    }
  });
  return pts;
})();

const TRAIL_LEN = TRAIL_POINTS[TRAIL_POINTS.length - 1].len;

/** Point on the trail at `fraction` (0–1) of its total length. */
function pointAlongTrail(fraction: number) {
  const target = Math.min(Math.max(fraction, 0), 1) * TRAIL_LEN;
  let i = 1;
  while (i < TRAIL_POINTS.length - 1 && TRAIL_POINTS[i].len < target) i++;
  const a = TRAIL_POINTS[i - 1];
  const b = TRAIL_POINTS[i];
  const k = (target - a.len) / (b.len - a.len || 1);
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    // the tern faces right, so tilt it to follow the direction of travel
    angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  };
}

const BIRD_SCALE = 0.0105;
const BIRD_CENTER = 1000 * BIRD_SCALE;
const FLIGHT_MS = 1800;
/** The bird's position updates at most this often (about 30 per second). */
const BIRD_UPDATE_MS = 33;

/** The bird at `value` (0–1) along the trail; it grows from 60% to full size over the first stretch. */
function birdAt(value: number) {
  return { ...pointAlongTrail(value), size: 0.6 + 0.4 * Math.min(value / 0.12, 1) };
}

/**
 * The bird flies the trail from the start to today's progress. Bump
 * `replayKey` (e.g. each time the screen gains focus) to fly it again.
 */
export function FlightPath({
  progress,
  replayKey = 0,
}: {
  progress: number;
  replayKey?: number;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const travel = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const [bird, setBird] = useState(() => birdAt(0));
  const [popBoost, setPopBoost] = useState(0);

  useEffect(() => {
    let lastAt = 0;
    const flightId = travel.addListener(({ value }) => {
      // Each update re-renders the SVG, so don't do it on every animation frame.
      const now = Date.now();
      if (now - lastAt < BIRD_UPDATE_MS) return;
      lastAt = now;
      setBird(birdAt(value));
    });
    const popId = pop.addListener(({ value }) => setPopBoost(value));
    travel.setValue(0);
    pop.setValue(0);
    Animated.timing(travel, {
      toValue: clamped,
      duration: FLIGHT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      // Land exactly on the final spot (the last throttled frame may be a touch short).
      if (finished) setBird(birdAt(clamped));
      if (finished && clamped >= 1) {
        Animated.sequence([
          Animated.timing(pop, { toValue: 1, duration: 180, useNativeDriver: false }),
          Animated.spring(pop, { toValue: 0, friction: 4, useNativeDriver: false }),
        ]).start();
      }
    });
    return () => {
      travel.removeListener(flightId);
      pop.removeListener(popId);
      travel.stopAnimation();
      pop.stopAnimation();
    };
  }, [clamped, replayKey, travel, pop]);

  const k = bird.size * (1 + 0.5 * popBoost);
  const dash = travel.interpolate({
    inputRange: [0, 1],
    outputRange: [TRAIL_LEN, 0],
  });

  return (
    <Svg width='100%' height={56} viewBox='0 0 280 56'>
      <Path
        d={TRAIL}
        fill='none'
        stroke='rgba(255,255,255,0.28)'
        strokeWidth={3}
        strokeLinecap='round'
      />
      <AnimatedPath
        d={TRAIL}
        fill='none'
        stroke='#FBFAF7'
        strokeWidth={3}
        strokeLinecap='round'
        strokeDasharray={TRAIL_LEN}
        strokeDashoffset={dash as unknown as number}
      />
      <Circle
        cx={232}
        cy={26}
        r={4.5}
        fill='none'
        stroke='rgba(255,255,255,0.7)'
        strokeWidth={2}
      />
      <G
        transform={`translate(${bird.x - BIRD_CENTER * k}, ${bird.y - BIRD_CENTER * k}) scale(${BIRD_SCALE * k}) rotate(${bird.angle} 1000 1000)`}
      >
        <Path d={TERN_PATH} fill={clamped >= 1 ? '#FBFAF7' : colors.sun} />
      </G>
    </Svg>
  );
}