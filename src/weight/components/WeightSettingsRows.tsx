import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font } from '@shared/theme';
import { Row, Stepper, ToggleRow } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { useUnits } from '@settings/hooks/useUnits';
import { useWeight } from '@weight/WeightContext';
import { Units } from '@shared/utils/units';

/** Whether weight is tracked at all, and the optional goal weight that draws a line on the trend. */
export function WeightSettingsRows() {
  const { settings, updateSettings } = useSettings();
  const { units, toDisplay, fromDisplay, formatGoal } = useUnits();
  const { weightEntries } = useWeight();

  // A new goal starts at the latest weigh-in, so it suggests no direction.
  const startGoal = () => updateSettings({ weightGoalLb: Math.round(weightEntries[0]?.lb ?? 150) });

  // Whole pounds, or half kilograms, in whichever unit is showing.
  const stepGoal = (dir: 1 | -1) => {
    if (settings.weightGoalLb === null) return;
    const shown = toDisplay(settings.weightGoalLb);
    const next = units === Units.Imperial ? Math.round(shown) + dir : Math.round(shown * 2) / 2 + dir * 0.5;
    updateSettings({ weightGoalLb: fromDisplay(next) });
  };

  return (
    <>
      <ToggleRow
        title='Track weight'
        sub='Off, Today never asks for a weigh-in'
        on={settings.trackWeight}
        onToggle={(v) => updateSettings({ trackWeight: v })}
      />
      {settings.trackWeight ? (
        <Row
          title='Goal weight'
          sub={
            settings.weightGoalLb === null
              ? 'Optional. No goal line is shown without one'
              : 'Shown as a line on your trend'
          }
          right={
            settings.weightGoalLb === null ? (
              <Pressable onPress={startGoal} hitSlop={8} accessibilityRole='button'>
                <Text style={s.link}>Set a goal</Text>
              </Pressable>
            ) : (
              <>
                <Stepper
                  value={formatGoal(settings.weightGoalLb)}
                  onDecrement={() => stepGoal(-1)}
                  onIncrement={() => stepGoal(1)}
                  valueMinWidth={52}
                />
                <Pressable
                  onPress={() => updateSettings({ weightGoalLb: null })}
                  hitSlop={8}
                  accessibilityRole='button'
                  accessibilityLabel='Remove goal weight'
                >
                  <Text style={s.link}>Remove</Text>
                </Pressable>
              </>
            )
          }
        />
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  link: { fontFamily: font.medium, fontSize: 13, color: colors.coral },
});
