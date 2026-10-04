import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, space } from '@shared/theme';
import type { DayBar } from './StepBars';
import { DayState } from '@shared/models/dayState';

/* ------------------------------------------------------------------ */
/* Consistency grid — a month at a glance                               */
/* ------------------------------------------------------------------ */

export function ConsistencyGrid({ days }: { days: DayBar['state'][] }) {
  return (
    <View style={cs.dotWrap}>
      {days.map((state, i) => {
        const style =
          state === DayState.Goal
            ? { backgroundColor: colors.glacier }
            : state === DayState.Partial
              ? { backgroundColor: colors.glacierTint }
              : state === DayState.Rest
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

const cs = StyleSheet.create({
  dotWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: space.sm,
    },
  dot: { width: 15, height: 15, borderRadius: 4 },
});
