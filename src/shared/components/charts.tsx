import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Path,
  Circle,
  Polyline,
  Polygon,
  Line,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { colors, font, space } from '../theme';
import { TERN_PATH } from './TernMark';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

/* ------------------------------------------------------------------ */
/* Step bars                                                            */
/* ------------------------------------------------------------------ */

export type DayBar = {
  label: string;
  value: number;
  state: 'goal' | 'partial' | 'rest' | 'none';
};

export function StepBars({
  days,
  height = 76,
  goal,
  showLegend = true,
  showLabels = true,
}: {
  days: DayBar[];
  height?: number;
  /** Step-count goal; renders a dashed reference line at that height. */
  goal?: number;
  showLegend?: boolean;
  showLabels?: boolean;
}) {
  const max = Math.max(...days.map((d) => d.value), goal ?? 0, 1);
  const goalPct = goal ? Math.min((goal / max) * 100, 100) : null;
  return (
    <View>
      <View style={[cs.bars, { height }]}>
        {goalPct !== null ? (
          <View style={[cs.goalLine, { bottom: `${goalPct}%` }]}>
            <Text style={cs.goalTag}>goal</Text>
          </View>
        ) : null}
        {days.map((d, i) => {
          const h = Math.max((d.value / max) * 100, 4);
          const style =
            d.state === 'goal'
              ? { backgroundColor: colors.glacier }
              : d.state === 'partial'
                ? { backgroundColor: colors.glacierTint }
                : d.state === 'rest'
                  ? {
                      backgroundColor: colors.driftwoodTint,
                      borderWidth: 1,
                      borderColor: colors.driftwood,
                    }
                  : { backgroundColor: colors.doveTint };
          return (
            <View key={i} style={cs.barCol}>
              <View style={[cs.bar, style, { height: `${h}%` }]} />
              {showLabels ? <Text style={cs.barLabel}>{d.label}</Text> : null}
            </View>
          );
        })}
      </View>
      {showLegend ? (
        <View style={cs.legend}>
          <LegendSwatch color={colors.glacier} label='goal met' />
          <LegendSwatch color={colors.glacierTint} label='partial' />
          <LegendSwatch
            color={colors.driftwoodTint}
            label='rest'
            border={colors.driftwood}
          />
        </View>
      ) : null}
    </View>
  );
}

function LegendSwatch({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: string;
}) {
  return (
    <View style={cs.legendItem}>
      <View
        style={[
          cs.sw,
          { backgroundColor: color },
          border ? { borderWidth: 1, borderColor: border } : null,
        ]}
      />
      <Text style={cs.legendText}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Weight trend — the band is the point: it makes daily noise visible   */
/* as normal rather than as change.                                     */
/* ------------------------------------------------------------------ */

export function WeightTrend({
  trend,
  spread,
  height = 92,
  goal,
}: {
  trend: number[];
  spread?: number;
  height?: number;
  /** Optional weight goal; renders a dashed moss reference line. */
  goal?: number;
}) {
  const W = 280;
  const H = height;
  const min = Math.min(...trend, goal ?? Infinity) - (spread ?? 0.8);
  const max = Math.max(...trend, goal ?? -Infinity) + (spread ?? 0.8);
  const range = max - min || 1;

  const pt = (v: number, i: number) => {
    const x = (i / (trend.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 14) - 7;
    return [x, y] as const;
  };

  const line = trend.map((v, i) => pt(v, i).join(',')).join(' ');
  const area = `0,${H} ${line} ${W},${H}`;

  const bandTop = trend
    .map((v, i) => pt(v + (spread ?? 0.6), i).join(','))
    .join(' ');
  const bandBottom = trend
    .map((v, i) => pt(v - (spread ?? 0.6), i))
    .reverse()
    .map((p) => p.join(','))
    .join(' ');

  const [lastX, lastY] = pt(trend[trend.length - 1], trend.length - 1);

  return (
    <Svg width='100%' height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id='wfill' x1='0' y1='0' x2='0' y2='1'>
          <Stop offset='0%' stopColor={colors.waterLight} stopOpacity={0.75} />
          <Stop
            offset='100%'
            stopColor={colors.waterLight}
            stopOpacity={0.08}
          />
        </LinearGradient>
      </Defs>
      {spread ? (
        <Polygon
          points={`${bandTop} ${bandBottom}`}
          fill={colors.doveTint}
          opacity={0.75}
        />
      ) : null}
      <Polygon points={area} fill='url(#wfill)' />
      {goal !== undefined ? (
        <>
          <Line
            x1={0}
            y1={pt(goal, 0)[1]}
            x2={W}
            y2={pt(goal, 0)[1]}
            stroke={colors.kelp}
            strokeWidth={1.5}
            strokeDasharray='4 4'
          />
          <SvgText
            x={4}
            y={pt(goal, 0)[1] - 4}
            fontSize={8.5}
            fill={colors.kelp}
          >
            goal {Number(goal.toFixed(1))}
          </SvgText>
        </>
      ) : null}
      <Polyline
        points={line}
        fill='none'
        stroke={colors.water}
        strokeWidth={2.5}
      />
      <Circle cx={lastX} cy={lastY} r={3.8} fill={colors.water} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Consistency grid — a month at a glance                               */
/* ------------------------------------------------------------------ */

export function ConsistencyGrid({ days }: { days: DayBar['state'][] }) {
  return (
    <View style={cs.dotWrap}>
      {days.map((state, i) => {
        const style =
          state === 'goal'
            ? { backgroundColor: colors.glacier }
            : state === 'partial'
              ? { backgroundColor: colors.glacierTint }
              : state === 'rest'
                ? {
                    backgroundColor: colors.driftwoodTint,
                    borderWidth: 1,
                    borderColor: colors.driftwood,
                  }
                : { backgroundColor: colors.doveTint };
        return <View key={i} style={[cs.dot, style]} />;
      })}
    </View>
  );
}

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

/* ------------------------------------------------------------------ */
/* Day rings (week strip)                                               */
/* ------------------------------------------------------------------ */

function DayRingBase({
  progress,
  label,
  today,
  rest,
  size = 23,
  replayKey = 0,
  delay = 0,
}: {
  progress: number;
  label: string;
  today?: boolean;
  rest?: boolean;
  size?: number;
  /** Bump to refill the ring from empty. */
  replayKey?: number;
  /** Stagger, in ms, before the ring starts filling. */
  delay?: number;
}) {
  const r = 12;
  const circ = 2 * Math.PI * r;
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fill.setValue(0);
    Animated.timing(fill, {
      toValue: 1,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, replayKey, delay, fill]);

  const ringOffset = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, circ * (1 - Math.min(progress, 1))],
  });
  const stroke = rest ? colors.driftwood : today ? colors.sun : colors.glacier;
  const track = rest ? '#E4DECE' : colors.border;
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Svg
        width={today ? size + 3 : size}
        height={today ? size + 3 : size}
        viewBox='0 0 30 30'
      >
        <Circle
          cx={15}
          cy={15}
          r={r}
          fill='none'
          stroke={track}
          strokeWidth={4}
        />
        <AnimatedCircle
          cx={15}
          cy={15}
          r={r}
          fill='none'
          stroke={stroke}
          strokeWidth={4}
          strokeLinecap='round'
          strokeDasharray={circ}
          strokeDashoffset={ringOffset as unknown as number}
          transform='rotate(-90 15 15)'
        />
      </Svg>
      <Text
        style={[
          cs.dayLabel,
          today && { fontFamily: font.bold, color: colors.ink },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// Memoized: the week strip re-renders with its screen, but a ring only needs to when its own props change.
export const DayRing = React.memo(DayRingBase);

const cs = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    marginTop: space.md,
    position: 'relative',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    gap: 4,
  },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barLabel: { fontFamily: font.body, fontSize: 9, color: colors.ink3 },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderTopColor: colors.dove,
    borderStyle: 'dashed',
  },
  goalTag: {
    position: 'absolute',
    right: 0,
    top: -8,
    fontFamily: font.body,
    fontSize: 9,
    color: colors.ink3,
    backgroundColor: colors.card,
    paddingHorizontal: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: space.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sw: { width: 9, height: 9, borderRadius: 2 },
  legendText: { fontFamily: font.body, fontSize: 10, color: colors.ink2 },
  dotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: space.sm,
  },
  dot: { width: 15, height: 15, borderRadius: 4 },
  dayLabel: { fontFamily: font.body, fontSize: 9.5, color: colors.ink2 },
});
