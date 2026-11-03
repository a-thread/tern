import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, space, typography } from '@shared/theme';
import { DayState } from '@shared/models/dayState';
import { LegendDot } from './LegendDot';
import { useDayNotes } from '@/domain/day-notes/DayNotesContext';
import { notedDays } from '@/domain/day-notes/models/dayNote';

/* ------------------------------------------------------------------ */
/* Step bars                                                            */
/* ------------------------------------------------------------------ */

export type DayBar = {
  label: string;
  value: number;
  state: DayState;
  /** Daily bars only: the day, so a day with a note gets a dot under its bar. */
  day?: string;
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
  const notes = useDayNotes();
  const noted = notedDays(notes.enabled ? notes.notes : []);
  const isNoted = (d: DayBar) => d.day !== undefined && noted.has(d.day);
  const anyNoted = days.some(isNoted);
  const max = Math.max(...days.map((d) => d.value), goal ?? 0, 1);
  const goalPct = goal ? Math.min((goal / max) * 100, 100) : null;
  // Many thin bars (a month, half a year) sit closer together.
  const gap = days.length > 14 ? 2 : 5;
  return (
    <View>
      <View style={[cs.bars, { height, gap }]}>
        {goalPct !== null ? (
          <View style={[cs.goalLine, { bottom: `${goalPct}%` }]} />
        ) : null}
        {days.map((d, i) => {
          const h = Math.max((d.value / max) * 100, 4);
          const style =
            d.state === DayState.Goal
              ? { backgroundColor: colors.glacier }
              : d.state === DayState.Partial
                ? {
                    backgroundColor: colors.card,
                    borderWidth: 1.5,
                    borderColor: colors.glacier,
                  }
                : d.state === DayState.Rest
                  ? {
                      backgroundColor: colors.driftwoodTint,
                      borderWidth: 1,
                      borderColor: colors.driftwood,
                    }
                  : d.state === DayState.Frozen
                    ? {
                        backgroundColor: colors.glacierTint,
                        borderWidth: 1,
                        borderColor: colors.glacierDeep,
                      }
                    : { backgroundColor: colors.progressTrack };
          return (
            <View key={i} style={cs.barCol}>
              <View style={[cs.bar, style, { height: `${h}%` }]} />
            </View>
          );
        })}
        {/* After the bars, so the label sits on top of them; the line stays behind. */}
        {goalPct !== null ? (
          <View style={[cs.goalTagAnchor, { bottom: `${goalPct}%` }]}>
            <Text style={cs.goalTag}>goal</Text>
          </View>
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
      ) : null}
      {showLegend || anyNoted ? (
        <View style={cs.legend}>
          {showLegend ? (
            <>
              <LegendDot color={colors.glacier} label='goal met' />
              <LegendDot
                color={colors.card}
                label='partial'
                border={colors.glacier}
              />
              <LegendDot
                color={colors.driftwoodTint}
                label='rest'
                border={colors.driftwood}
              />
            </>
          ) : null}
          {anyNoted ? (
            <LegendDot color={colors.driftwood} label='note' />
          ) : null}
        </View>
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
  goalTagAnchor: { position: 'absolute', right: 0 },
  goalTag: {
    position: 'absolute',
    right: 0,
    top: -9,
    ...typography.tick,
    backgroundColor: colors.card,
    paddingHorizontal: 3,
  },
  // The bars have their own fixed-height area; the labels sit below it, so the
  // tallest bar can never grow up into the text above the chart.
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: space.sm,
  },
});
