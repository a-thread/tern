import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, space, typography } from '@shared/theme';
import { DayState } from '@shared/models/dayState';
import { useChartSelection } from '@shared/hooks/useChartSelection';
import { formatShortDate } from '@shared/utils/date';

/* ------------------------------------------------------------------ */
/* Consistency grid — a month at a glance                               */
/* ------------------------------------------------------------------ */

/** How each kind of day reads once a square is tapped. */
const STATE_WORD: Readonly<Record<DayState, string>> = {
  [DayState.Goal]: 'goal met',
  [DayState.Partial]: 'partial',
  [DayState.Rest]: 'rest day',
  [DayState.Frozen]: 'covered by a streak freeze',
  [DayState.None]: 'no steps',
};

/** A square per day. Tapping one names its date and how it went under the grid; tap it again to clear. */
export function ConsistencyGrid({
  days,
}: {
  days: readonly { day: string; state: DayState }[];
}) {
  const { selected, toggle } = useChartSelection(days.map((d) => d.day));
  const describe = (d: { day: string; state: DayState }) =>
    `${formatShortDate(d.day)} · ${STATE_WORD[d.state]}`;
  return (
    <>
      <View style={cs.dotWrap}>
        {days.map((d, i) => {
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
            <Pressable
              key={d.day}
              onPress={() => toggle(i)}
              // Half the gap on each side, so neighbouring squares never share a touch.
              hitSlop={2}
              accessibilityRole='button'
              accessibilityLabel={describe(d)}
              accessibilityState={{ selected: selected === i }}
              style={[cs.dot, style, selected === i ? cs.picked : null]}
            />
          );
        })}
      </View>
      {selected !== null ? (
        <Text style={cs.pickedText} accessibilityLiveRegion='polite'>
          {describe(days[selected])}
        </Text>
      ) : null}
    </>
  );
}

const cs = StyleSheet.create({
  dotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: space.sm,
  },
  dot: { width: 15, height: 15, borderRadius: 4 },
  picked: { borderWidth: 2, borderColor: colors.ink },
  pickedText: { ...typography.caption, marginTop: space.sm },
});
