import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, space, typography } from '@shared/theme';
import { ChartTip } from '@shared/components/ChartTip/ChartTip';
import { useChartSelection } from '@shared/hooks/useChartSelection';
import { LegendDot } from './LegendDot';
import { DayStateLegend } from './DayStateLegend/DayStateLegend';
import { DAY_STATE_STYLE } from '../utils/dayStateStyle';
import { DayState } from '@shared/models/dayState';
import { barDate, type DaySpan } from '../models/barDate';
import { useDayNotes } from '@/domain/day-notes/DayNotesContext';

/* ------------------------------------------------------------------ */
/* Step bars                                                            */
/* ------------------------------------------------------------------ */

export type DayBar = {
  label: string;
  value: number;
  state: DayState;
  /** Daily bars only: the day, so a day with a note gets a dot under its bar. */
  day?: string;
  /** Weekly bars only: the days the bar covers. */
  week?: DaySpan;
};

/**
 * Tapping a bar names its date (and value, given `formatValue`) over the chart and fades the others;
 * tap it again to clear. The goal line is named in the legend, not on the chart, so its label
 * never covers a bar. Without a label under each bar (a month of thin bars), the first and last
 * dates are shown at the ends instead.
 */
export function StepBars({
  days,
  height = 76,
  goal,
  showLegend = true,
  showLabels = true,
  formatValue,
}: {
  days: DayBar[];
  height?: number;
  /** Step-count goal; renders a dashed reference line at that height, named in the legend. */
  goal?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  /** What a tapped bar's value reads as ("8,410 steps"). */
  formatValue?: (bar: DayBar) => string;
}) {
  const { noted } = useDayNotes();
  const dates = days.map((d) => barDate(d) ?? '');
  const { selected, toggle } = useChartSelection(dates);
  const describe = (d: DayBar, i: number) =>
    formatValue ? `${dates[i]} · ${formatValue(d)}` : dates[i];
  const isNoted = (d: DayBar) => d.day !== undefined && noted.has(d.day);
  const anyNoted = days.some(isNoted);
  const max = Math.max(...days.map((d) => d.value), goal ?? 0, 1);
  const goalPct = goal ? Math.min((goal / max) * 100, 100) : null;
  // Many thin bars (a month, half a year) sit closer together.
  const gap = days.length > 14 ? 2 : 5;
  const edges =
    !showLabels && dates.length > 1 && dates[0] && dates[dates.length - 1]
      ? { from: dates[0], to: dates[dates.length - 1] }
      : null;
  const extraKeys = (
    <>
      {goalPct !== null ? <GoalKey /> : null}
      {anyNoted ? <LegendDot color={colors.driftwood} label='note' /> : null}
    </>
  );
  return (
    <View>
      <View style={[cs.bars, { height, gap }]}>
        {goalPct !== null ? (
          <View style={[cs.goalLine, { bottom: `${goalPct}%` }]} />
        ) : null}
        {days.map((d, i) => {
          const h = Math.max((d.value / max) * 100, 4);
          const bar = (
            <View
              style={[
                cs.bar,
                DAY_STATE_STYLE[d.state],
                { height: `${h}%` },
                selected !== null && selected !== i ? cs.dimmed : null,
              ]}
            />
          );
          return dates[i] ? (
            <Pressable
              key={i}
              style={cs.barCol}
              onPress={() => toggle(i)}
              // Month bars are thin: reach above and below them, not into the next bar.
              hitSlop={{ top: space.sm, bottom: space.sm }}
              accessibilityRole='button'
              accessibilityLabel={describe(d, i)}
              accessibilityState={{ selected: selected === i }}
            >
              {bar}
            </Pressable>
          ) : (
            <View key={i} style={cs.barCol}>
              {bar}
            </View>
          );
        })}
        {selected !== null ? (
          <ChartTip
            text={describe(days[selected], selected)}
            at={(selected + 0.5) / days.length}
          />
        ) : null}
      </View>
      {/* Under the bars rather than on them, so a tall bar never hides its dot. */}
      {anyNoted ? (
        <View style={[cs.noteRow, { gap }]}>
          {days.map((d, i) => (
            <View key={i} style={cs.noteCol}>
              {isNoted(d) ? <View style={cs.noteDot} /> : null}
            </View>
          ))}
        </View>
      ) : null}
      {showLabels ? (
        <View style={[cs.labelRow, { gap }]}>
          {days.map((d, i) => (
            <Text key={i} style={cs.barLabel} numberOfLines={1}>
              {d.label}
            </Text>
          ))}
        </View>
      ) : edges ? (
        <View style={cs.edgeRow}>
          <Text style={cs.edgeLabel}>{edges.from}</Text>
          <Text style={cs.edgeLabel}>{edges.to}</Text>
        </View>
      ) : null}
      {showLegend ? (
        <DayStateLegend
          frozen={days.some((d) => d.state === DayState.Frozen)}
          style={cs.legend}
        >
          {extraKeys}
        </DayStateLegend>
      ) : goalPct !== null || anyNoted ? (
        <View style={[cs.legendRow, cs.legend]}>{extraKeys}</View>
      ) : null}
    </View>
  );
}

const cs = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: space.md,
    position: 'relative',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderTopColor: colors.dove,
    borderStyle: 'dashed',
  },
  goalKey: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  goalKeyLine: {
    width: 12,
    borderTopWidth: 1.5,
    borderTopColor: colors.dove,
    borderStyle: 'dashed',
  },
  goalKeyText: typography.small,
  // The bars have their own fixed-height area; the labels sit below it, so the
  // tallest bar can never grow up into the text above the chart.
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  // The other bars step back while one is picked, so it's clear which one the label names.
  dimmed: { opacity: 0.4 },
  noteRow: { flexDirection: 'row', marginTop: 3, height: 5 },
  noteCol: { flex: 1, alignItems: 'center' },
  noteDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.driftwood,
  },
  labelRow: { flexDirection: 'row', marginTop: 4 },
  barLabel: { ...typography.tick, flex: 1, textAlign: 'center' },
  edgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  edgeLabel: typography.tick,
  legend: { marginTop: space.sm },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
});

/** The legend's entry for the dashed goal line. */
function GoalKey() {
  return (
    <View style={cs.goalKey}>
      <View style={cs.goalKeyLine} />
      <Text style={cs.goalKeyText}>goal</Text>
    </View>
  );
}
