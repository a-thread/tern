import React, { useEffect, useRef } from 'react';
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
  Text as SvgText,
} from 'react-native-svg';
import { colors, font, space } from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/* ------------------------------------------------------------------ */
/* Flight path — draws itself toward the goal on mount                  */
/* ------------------------------------------------------------------ */

const TRAIL = 'M4,42 C 58,42 54,13 112,13 S 186,40 232,26';
const TRAIL_LEN = 300;

export function FlightPath({ progress }: { progress: number }) {
  const dash = useRef(new Animated.Value(TRAIL_LEN)).current;
  const clamped = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    Animated.timing(dash, {
      toValue: TRAIL_LEN * (1 - clamped),
      duration: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, dash]);

  // rough position of the bird along the curve
  const birdX = 4 + (232 - 4) * clamped;
  const birdY = 42 - 29 * Math.sin(Math.PI * clamped * 0.85);

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
      <Circle
        cx={birdX}
        cy={birdY}
        r={4}
        fill={clamped >= 1 ? '#FBFAF7' : colors.sun}
      />
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
  goalKg,
}: {
  trend: number[];
  spread?: number;
  height?: number;
  /** Optional weight goal; renders a dashed moss reference line. */
  goalKg?: number;
}) {
  const W = 280;
  const H = height;
  const min = Math.min(...trend, goalKg ?? Infinity) - (spread ?? 0.8);
  const max = Math.max(...trend, goalKg ?? -Infinity) + (spread ?? 0.8);
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
      {goalKg !== undefined ? (
        <>
          <Line
            x1={0}
            y1={pt(goalKg, 0)[1]}
            x2={W}
            y2={pt(goalKg, 0)[1]}
            stroke={colors.kelp}
            strokeWidth={1.5}
            strokeDasharray='4 4'
          />
          <SvgText
            x={4}
            y={pt(goalKg, 0)[1] - 4}
            fontSize={8.5}
            fill={colors.kelp}
          >
            goal {goalKg}
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

export function JourneyRoute({ progress }: { progress: number }) {
  const path = 'M6,34 C 48,34 58,9 104,9 S 172,30 206,17 S 254,11 272,7';
  const dash = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    Animated.timing(dash, {
      toValue: 320 * (1 - Math.min(progress, 1)),
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, dash]);

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
        strokeDasharray={320}
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

export function DayRing({
  progress,
  label,
  today,
  rest,
  size = 23,
}: {
  progress: number;
  label: string;
  today?: boolean;
  rest?: boolean;
  size?: number;
}) {
  const r = 12;
  const circ = 2 * Math.PI * r;
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
        <Circle
          cx={15}
          cy={15}
          r={r}
          fill='none'
          stroke={stroke}
          strokeWidth={4}
          strokeLinecap='round'
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(progress, 1))}
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
