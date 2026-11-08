import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, space, typography } from '@shared/theme';
import { DayState } from '@shared/models/dayState';
import { useChartSelection } from '@shared/hooks/useChartSelection';
import { formatShortDate } from '@shared/utils/date';
import { ChartTip } from '@shared/components/ChartTip/ChartTip';
import { DAY_STATE_STYLE } from '../../utils/dayStateStyle';
import {
  byWeekday,
  calendarRows,
  GridLayout,
  gridLayout,
  weekRows,
  WEEKDAY_LETTERS,
  type WeekRow,
} from './models/weekRows';

/* ------------------------------------------------------------------ */
/* Consistency grid — the range at a glance, by weekday                 */
/* ------------------------------------------------------------------ */

/** How each kind of day reads once a square is tapped. */
const STATE_WORD: Readonly<Record<DayState, string>> = {
  [DayState.Goal]: 'goal met',
  [DayState.Partial]: 'partial',
  [DayState.Rest]: 'rest day',
  [DayState.Frozen]: 'covered by a streak freeze',
  [DayState.None]: 'no steps',
};

type Day = { day: string; state: DayState };

/**
 * A cell per day, lined up by weekday so a pattern across the week shows (quieter weekends,
 * say). A month is a small calendar, a row per week from Monday, and a week is one row in day
 * order; six months turns on its side, a column per week. Tapping a square names its date and how it went in a label over
 * it, as tapping a bar does in the charts; tap it again to clear.
 */
export function ConsistencyGrid({ days }: { days: readonly Day[] }) {
  const { selected, toggle } = useChartSelection(days.map((d) => d.day));
  const describe = (d: Day) =>
    `${formatShortDate(d.day)} · ${STATE_WORD[d.state]}`;
  const weeks = weekRows(days);
  const layout = gridLayout(weeks.length);
  const calendar = layout === GridLayout.Calendar;
  const { letters, rows } = calendarRows(days);
  const matrix = calendar ? rows : byWeekday(weeks);
  // Where the tapped day sits, so its label can hang over it.
  const pickedRow =
    selected === null ? -1 : matrix.findIndex((r) => r.includes(selected));

  const cell = (slot: number | null, key: number) => {
    const shape = [cs.cell, calendar ? cs.calendarCell : cs.stripCell];
    if (slot === null) return <View key={key} style={shape} />;
    const d = days[slot];
    return (
      <Pressable
        key={key}
        onPress={() => toggle(slot)}
        // Half the gap on each side, so neighbouring squares never share a touch.
        hitSlop={calendar ? 2 : 1}
        accessibilityRole='button'
        accessibilityLabel={describe(d)}
        accessibilityState={{ selected: selected === slot }}
        style={[
          shape,
          DAY_STATE_STYLE[d.state],
          selected === slot ? cs.picked : null,
        ]}
      />
    );
  };
  const gap = calendar ? cs.calendarGap : cs.stripGap;
  const row = (slots: WeekRow, r: number, label?: string) => (
    <View key={r} style={[cs.row, gap]}>
      {label !== undefined ? (
        <Text style={cs.rowLabel} importantForAccessibility='no'>
          {label}
        </Text>
      ) : null}
      {/* The squares on their own, so the label lines up over its column. Later rows draw
          over earlier ones, so the label sits on top of the row above. */}
      <View style={cs.cellsBox}>
        {/* The label stays out of the squares' own row: the gap would count it as one more
            square and the row's squares would come out narrower than the others. */}
        <View style={[cs.cells, gap]}>{slots.map(cell)}</View>
        {r === pickedRow && selected !== null ? (
          <ChartTip
            text={describe(days[selected])}
            at={(slots.indexOf(selected) + 0.5) / slots.length}
            above
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <>
      {calendar ? (
        <View style={[cs.calendar, cs.calendarGap]}>
          <View
            style={[cs.row, cs.calendarGap]}
            importantForAccessibility='no-hide-descendants'
            accessibilityElementsHidden
          >
            {letters.map((l, i) => (
              <Text key={i} style={cs.headLetter}>
                {l}
              </Text>
            ))}
          </View>
          {matrix.map((w, i) => row(w, i))}
        </View>
      ) : (
        <View style={[cs.strip, cs.stripGap]}>
          {matrix.map((r, i) => row(r, i, WEEKDAY_LETTERS[i]))}
        </View>
      )}
    </>
  );
}

const cs = StyleSheet.create({
  // Seven columns across the whole card. The days are wider than tall, so a month stays a
  // glance (five or six short rows) rather than a tall block of big squares.
  calendar: { marginTop: space.sm },
  strip: { marginTop: space.sm },
  calendarGap: { gap: 4 },
  stripGap: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cellsBox: { flex: 1 },
  cells: { flexDirection: 'row' },
  cell: { flex: 1 },
  calendarCell: { height: 26, borderRadius: 5 },
  // Six months is 26 columns: squares as wide as the card allows.
  stripCell: { aspectRatio: 1, borderRadius: 2 },
  headLetter: { ...typography.tick, flex: 1, textAlign: 'center' },
  rowLabel: { ...typography.tick, width: 10 },
  picked: { borderWidth: 2, borderColor: colors.ink },
});
