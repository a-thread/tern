import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, space } from '@shared/theme';
import { DayState } from '@shared/models/dayState';
import { LegendDot } from '@shared/components/ui';

/* ------------------------------------------------------------------ */
/* Step bars                                                            */
/* ------------------------------------------------------------------ */

export type DayBar = {
  label: string;
  value: number;
  state: DayState;
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
  // Many thin bars (a month, half a year) sit closer together.
  const gap = days.length > 14 ? 2 : 5;
  return (
    <View>
      <View style={[cs.bars, { height, gap }]}>
        {goalPct !== null ? (
          <View style={[cs.goalLine, { bottom: `${goalPct}%` }]}>
            <Text style={cs.goalTag}>goal</Text>
          </View>
        ) : null}
        {days.map((d, i) => {
          const h = Math.max((d.value / max) * 100, 4);
          const style =
            d.state === DayState.Goal
              ? { backgroundColor: colors.glacier }
              : d.state === DayState.Partial
                ? { backgroundColor: colors.glacierTint }
                : d.state === DayState.Rest
                  ? {
                      backgroundColor: colors.driftwoodTint,
                      borderWidth: 1,
                      borderColor: colors.driftwood,
                    }
                  : d.state === DayState.Frozen
                ? { backgroundColor: colors.glacierTint, borderWidth: 1, borderColor: colors.glacierDeep }
                : { backgroundColor: colors.doveTint };
          return (
            <View key={i} style={cs.barCol}>
              <View style={[cs.bar, style, { height: `${h}%` }]} />
            </View>
          );
        })}
      </View>
      {showLabels ? (
        <View style={[cs.labelRow, { gap }]}>
          {days.map((d, i) => (
            <Text key={i} style={cs.barLabel} numberOfLines={1}>
              {d.label}
            </Text>
          ))}
        </View>
      ) : null}
      {showLegend ? (
        <View style={cs.legend}>
          <LegendDot color={colors.glacier} label='goal met' />
          <LegendDot color={colors.glacierTint} label='partial' />
          <LegendDot
            color={colors.driftwoodTint}
            label='rest'
            border={colors.driftwood}
          />
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
  // The bars have their own fixed-height area; the labels sit below it, so the
    // tallest bar can never grow up into the text above the chart.
    barCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: '100%',
    },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  labelRow: { flexDirection: 'row', marginTop: 4 },
  barLabel: {
      flex: 1,
      textAlign: 'center',
      fontFamily: font.body,
      fontSize: 9,
      color: colors.ink3,
    },
  legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 14,
      marginTop: space.sm,
    },
});
