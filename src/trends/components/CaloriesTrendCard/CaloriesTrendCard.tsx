import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '@shared/theme';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { TrendRange } from '../../models/trendRange';
import { TrendCard, TrendFigure } from '../TrendCard';
import { MacroBox } from './components/MacroBox/MacroBox';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { averageIntake, type IntakeAverage } from '../../models/intake';
import { useFood } from '@/domain/food/FoodContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';

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
  const { showCalories, showMacros } = useFoodDisplay();
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

  // Calories and macros are tracked separately; the card shows whichever are shown.
  return (
    <TrendCard title={showCalories ? 'Calories' : 'Macros'}>
      {showCalories ? (
        <TrendFigure
          value={intake ? intake.calories.toLocaleString() : '—'}
          sub={`${intake ? `daily average · last ${foodDays} days` : 'no food logged yet'} · target ${settings.calorieTarget.toLocaleString()}`}
        />
      ) : null}
      {showMacros ? (
        <View style={showCalories ? s.macroRow : s.macroRowAlone}>
          <MacroBox
            value={intake ? `${intake.protein}g` : '—'}
            label='protein'
            bg={colors.kelpTint}
            color={colors.kelp}
          />
          <MacroBox
            value={intake ? `${intake.carbs}g` : '—'}
            label='carbs'
            bg={colors.glacierTint}
            color={colors.glacierDeep}
          />
          <MacroBox
            value={intake ? `${intake.fat}g` : '—'}
            label='fat'
            bg={colors.sunTint}
            color={colors.sunDeep}
          />
        </View>
      ) : null}
      {/* With calories hidden, the macros say when there's nothing yet, as the calories line does. */}
      {!showCalories ? (
        <Text style={s.macroSub}>
          {intake
            ? `daily average · last ${foodDays} days`
            : 'no food logged yet'}
        </Text>
      ) : null}
    </TrendCard>
  );
}

const s = StyleSheet.create({
  macroRow: { flexDirection: 'row', gap: 6, marginTop: space.sm + 1 },
  macroRowAlone: { flexDirection: 'row', gap: 6 },
  macroSub: { ...typography.small, marginTop: space.sm },
});
