import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, space } from '@/shared/theme';
import { useDayKey } from '@/shared/hooks/useDayKey';
import { addDays } from '@/shared/utils/date';
import { TrendRange } from '@/trends/models/trendRange';
import { TrendCard, TrendFigure } from '@/trends/components/TrendCard/TrendCard';
import { MacroBox } from '@/trends/components/CaloriesTrendCard/components/MacroBox/MacroBox';
import { useFocusLoad } from '@/trends/hooks/useFocusLoad';
import { averageIntake, type IntakeAverage } from '@/trends/models/intake';
import { useFood } from '@/domain/food/FoodContext';
import { useSettings } from '@/domain/settings/SettingsContext';

/** Average calories and macros logged over the last week (or 30 days for longer ranges). */
export function CaloriesTrendCard({
  range,
  refreshKey = 0,
}: {
  range: TrendRange;
  /** Bump to read the history again (pull to refresh). */
  refreshKey?: number;
}) {
  const { settings } = useSettings();
  const { foodLog, loadHistory } = useFood();
  const today = useDayKey();
  const [intake, setIntake] = useState<IntakeAverage | null>(null);
  // A longer window would mean loading a lot of rows for little gain.
  const foodDays = range === TrendRange.Week ? 7 : 30;

  useFocusLoad(
    () => loadHistory(addDays(today, -(foodDays - 1)), today),
    (byDay) => setIntake(averageIntake(byDay, today)),
    [loadHistory, today, foodDays, foodLog, refreshKey], // foodLog and refreshKey: read again after logging or a pull
    'Could not load food history',
  );

  return (
    <TrendCard title='Calories'>
      <TrendFigure
        value={intake ? intake.calories.toLocaleString() : '—'}
        sub={`${intake ? `daily average · last ${foodDays} days` : 'no food logged yet'} · target ${settings.calorieTarget.toLocaleString()}`}
      />
      <View style={s.macroRow}>
        <MacroBox value={intake ? `${intake.protein}g` : '—'} label='protein' bg={colors.kelpTint} color={colors.kelp} />
        <MacroBox value={intake ? `${intake.carbs}g` : '—'} label='carbs' bg={colors.glacierTint} color={colors.glacierDeep} />
        <MacroBox value={intake ? `${intake.fat}g` : '—'} label='fat' bg={colors.sunTint} color={colors.sunDeep} />
      </View>
    </TrendCard>
  );
}

const s = StyleSheet.create({
  macroRow: { flexDirection: 'row', gap: 6, marginTop: space.sm + 1 },
});
