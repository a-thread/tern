import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { DayState } from '@shared/models/dayState';
import { LegendDot } from '../LegendDot';
import { DayStateLook } from '../../utils/dayStateStyle';

/**
 * The key to how a day went, for the step bars and the consistency grid: goal met, partial and
 * rest, plus a streak freeze when one shows. Both draw from `DayStateLook.STYLE`, so it matches.
 */
export function DayStateLegend({
  frozen = false,
  children,
  style,
}: {
  /** A day in view was covered by a streak freeze. */
  frozen?: boolean;
  /** More entries after these (the goal line, a note). */
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  const states = [
    DayState.Goal,
    DayState.Partial,
    DayState.Rest,
    ...(frozen ? [DayState.Frozen] : []),
  ];
  return (
    <View style={[s.legend, style]}>
      {states.map((state) => (
        <LegendDot
          key={state}
          color={DayStateLook.STYLE[state].backgroundColor}
          border={DayStateLook.STYLE[state].borderColor}
          label={DayStateLook.LABEL[state]}
        />
      ))}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
});
