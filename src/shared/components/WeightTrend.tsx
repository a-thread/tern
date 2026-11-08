import React from 'react';
import Svg, {
  Circle,
  Polyline,
  Polygon,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { View } from 'react-native';
import { colors } from '../theme';
import { useChartSelection } from '../hooks/useChartSelection';
import { formatShortDate } from '../utils/date';
import { PointTapZones } from './PointTapZones/PointTapZones';

/* ------------------------------------------------------------------ */
/* Weight trend — the band is the point: it makes daily noise visible   */
/* as normal rather than as change.                                     */
/* ------------------------------------------------------------------ */

export function WeightTrend({
  trend,
  spread,
  height = 92,
  goal,
  days,
  formatValue = String,
}: {
  trend: number[];
  spread?: number;
  height?: number;
  /** Optional weight goal; renders a dashed moss reference line. */
  goal?: number;
  /**
   * The day of each point, oldest first, one per `trend` value. Given these, tapping the
   * chart names the nearest point's date and value; tap it again to clear.
   */
  days?: readonly string[];
  /** What a tapped point's value reads as ("172.4 lb"). */
  formatValue?: (value: number) => string;
}) {
  const W = 280;
  const H = height;
  const tappable = days !== undefined && days.length === trend.length;
  const labels = tappable
    ? days.map((d, i) => `${formatShortDate(d)} · ${formatValue(trend[i])}`)
    : [];
  const { selected, toggle } = useChartSelection(labels);
  if (trend.length === 0)
    return <Svg width='100%' height={H} viewBox={`0 0 ${W} ${H}`} />;
  const min = Math.min(...trend, goal ?? Infinity) - (spread ?? 0.8);
  const max = Math.max(...trend, goal ?? -Infinity) + (spread ?? 0.8);
  const range = max - min || 1;

  // One reading has no line to draw: sit it in the middle instead of dividing by zero
  // (a NaN coordinate crashes react-native-svg natively, closing the whole app).
  const pt = (v: number, i: number) => {
    const x = trend.length > 1 ? (i / (trend.length - 1)) * W : W / 2;
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
  const picked = selected === null ? null : pt(trend[selected], selected);

  const chart = (
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
      {picked ? (
        <Circle
          cx={picked[0]}
          cy={picked[1]}
          r={5}
          fill={colors.card}
          stroke={colors.water}
          strokeWidth={2.5}
        />
      ) : null}
    </Svg>
  );
  return tappable ? (
    <View>
      {chart}
      <PointTapZones
        labels={labels}
        selected={selected}
        onSelect={toggle}
        viewBoxWidth={W}
      />
    </View>
  ) : (
    chart
  );
}
