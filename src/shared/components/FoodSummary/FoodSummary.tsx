import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space } from '../../theme';
import { useViewedDay } from '../../state/ViewedDayContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import { dayTotals } from '@/domain/food/models/foodEntry';
import { useFood } from '@/domain/food/FoodContext';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import { IntakeBarometer } from './components/IntakeBarometer/IntakeBarometer';

/**
 * The viewed day's intake at a glance: the swipeable intake card, or, with that switched off in
 * Settings, a row of calories (or calories left), protein and fat. Heads the Food screen and sits
 * on Today.
 */
export function FoodSummary() {
  const { isToday } = useViewedDay();
  const { foodLog } = useFood();
  const { settings } = useSettings();
  const { showCalories } = useFoodDisplay();
  const totals = dayTotals(foodLog);

  if (settings.showIntakeBars && settings.trackCalories) {
    return <IntakeBarometer totals={totals} entries={foodLog} />;
  }

  const remainingCalories = Math.max(
    settings.calorieTarget - totals.calories,
    0,
  );
  return (
    <View style={s.statRow}>
      {/* With calorie tracking (or calorie numbers) off there is no calorie chip at all. */}
      {!showCalories ? null : settings.showRemainingVsTarget ? (
        <Stat
          value={Math.round(remainingCalories).toLocaleString()}
          label={isToday ? 'left today' : 'left'}
        />
      ) : (
        <Stat
          value={Math.round(totals.calories).toLocaleString()}
          label='calories'
        />
      )}
      <Stat
        value={`${Math.round(totals.protein)}g`}
        label='protein'
        color={colors.kelp}
      />
      <Stat
        value={`${Math.round(totals.fat)}g`}
        label='fat'
        color={colors.sunDeep}
      />
    </View>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: 7, marginTop: space.xs },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  statLabel: {
    fontFamily: font.body,
    fontSize: 9.5,
    color: colors.ink2,
    marginTop: 1,
  },
});
