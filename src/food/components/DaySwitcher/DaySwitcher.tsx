import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { formatLongDate } from '@shared/utils/date';
import { dayRange } from './utils/dayRange';

/**
 * The date above the Food title, with arrows to step a day back or forward. It moves the same
 * viewed day as the week strip on Today, so both tabs always show the same day.
 */
export function DaySwitcher() {
  const { day, today, setDay } = useViewedDay();
  const { prev, next } = dayRange(day, today);

  return (
    <View style={s.row}>
      <Arrow
        name='chevron-left'
        label='Previous day'
        onPress={prev ? () => setDay(prev) : undefined}
      />
      <Text style={s.date}>{formatLongDate(day)}</Text>
      <Arrow
        name='chevron-right'
        label='Next day'
        onPress={next ? () => setDay(next) : undefined}
      />
    </View>
  );
}

function Arrow({
  name,
  label,
  onPress,
}: {
  name: 'chevron-left' | 'chevron-right';
  label: string;
  /** Left out at the end of the range: the arrow stays, dimmed, so the date doesn't shift. */
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={10}
      accessibilityRole='button'
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
    >
      <Icon
        name={name}
        size={18}
        color={onPress ? colors.ink2 : colors.dove}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: typography.meta,
});
