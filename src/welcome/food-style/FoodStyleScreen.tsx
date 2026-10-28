import React from 'react';
import { StyleSheet } from 'react-native';

import { FootNote, Group, ToggleRow } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { WizardStep as Step } from '../models/wizardSteps';
import { space } from '@/shared/theme';

/**
 * Calories and macros, each on its own switch: the same two as Settings › Targets. Turning
 * calories on here also shows the counts, since that is what was asked for.
 */
export default function FoodStyleScreen() {
  const { settings, updateSettings } = useSettings();
  const calories = settings.trackCalories && settings.showCalories;

  return (
    <WizardStep
      step={Step.FoodStyle}
      title='Food logging options'
      body='Turn on calories, macros, or both to set the corresponding daily targets. Targets and counts are for display only and never affect points.'
    >
      <Group style={s.group}>
        <ToggleRow
          title='Track calories'
          sub='A daily calorie target and calorie counts'
          on={calories}
          onToggle={(v) =>
            updateSettings(
              v
                ? { trackCalories: true, showCalories: true }
                : { trackCalories: false },
            )
          }
        />
        <ToggleRow
          title='Track macros'
          sub='Protein, carb and fat targets'
          on={settings.trackMacros}
          onToggle={(v) => updateSettings({ trackMacros: v })}
        />
      </Group>
      {calories || settings.trackMacros ? null : (
        <FootNote>Just what you ate and when, with no numbers.</FootNote>
      )}
    </WizardStep>
  );
}

const s = StyleSheet.create({
  group: { marginTop: space.md },
});
