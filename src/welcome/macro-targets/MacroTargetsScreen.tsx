import React from 'react';

import { Group, GroupLabel, ToggleRow } from '@shared/components/ui';
import { MacroSplitPicker } from '@shared/components/MacroSplitPicker/MacroSplitPicker';
import { useSettings } from '@/domain/settings/SettingsContext';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { WizardStep as Step } from '../models/wizardSteps';

/**
 * The macro split, the same control as Settings › Targets › Macros. Intake bars are offered
 * here when the calorie screen (which offers them otherwise) was left out.
 */
export default function MacroTargetsScreen() {
  const { settings, updateSettings } = useSettings();
  const askedWithCalories = settings.trackCalories && settings.showCalories;

  return (
    <WizardStep
      step={Step.MacroTargets}
      title='Your macro targets'
      body='A starting point. You can change it any time.'
    >
      <MacroSplitPicker />

      {askedWithCalories && !settings.showIntakeBars ? null : (
        <>
          <GroupLabel>Show it</GroupLabel>
          <Group>
            {askedWithCalories ? null : (
              <ToggleRow
                title='Show intake bars'
                sub='Protein, carbs and fat against your targets on Food and Today'
                on={settings.showIntakeBars}
                onToggle={(v) => updateSettings({ showIntakeBars: v })}
              />
            )}
            {settings.showIntakeBars ? (
              <ToggleRow
                title='Protein as a minimum'
                sub='Something to reach, not a limit'
                on={settings.proteinAsMinimum}
                onToggle={(v) => updateSettings({ proteinAsMinimum: v })}
              />
            ) : null}
          </Group>
        </>
      )}
    </WizardStep>
  );
}
