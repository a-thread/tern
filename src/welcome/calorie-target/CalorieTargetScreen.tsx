import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { space, typography } from '@shared/theme';
import {
  Group,
  GroupLabel,
  SegmentedControl,
  ToggleRow,
} from '@shared/components/ui';
import { CalorieTargetPicker } from '@shared/components/CalorieTargetPicker/CalorieTargetPicker';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useAdaptiveTarget } from '@/domain/food/hooks/useAdaptiveTarget';
import { Aim, AIM_LABEL } from '@/domain/settings/models/aim';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { WizardStep as Step } from '../models/wizardSteps';

const AIMS = Object.values(Aim);

/** No estimate from age or height: the adaptive target learns the real number. */
export default function CalorieTargetScreen() {
  const { settings, updateSettings } = useSettings();
  const adaptive = useAdaptiveTarget();

  return (
    <WizardStep
      step={Step.CalorieTarget}
      title='Your daily calorie target'
      body='A starting point. You can change it any time.'
    >
      <CalorieTargetPicker />

      <GroupLabel>Show it</GroupLabel>
      <Group>
        <ToggleRow
          title='Show intake bars'
          sub='Calories against a soft zone on Food and Today'
          on={settings.showIntakeBars}
          onToggle={(v) => updateSettings({ showIntakeBars: v })}
        />
        {adaptive.available ? (
          <ToggleRow
            title='Adapt my target'
            sub='Learns how much energy you use from your log and weight trend'
            on={settings.adaptTarget}
            onToggle={(v) => updateSettings({ adaptTarget: v })}
          />
        ) : null}
      </Group>

      {adaptive.on ? (
        <>
          <Text style={s.label}>Aiming to</Text>
          <SegmentedControl
            options={AIMS}
            value={settings.aim}
            onChange={(aim) => updateSettings({ aim })}
            label={(a) => AIM_LABEL[a]}
          />
        </>
      ) : null}
    </WizardStep>
  );
}

const s = StyleSheet.create({
  label: { ...typography.label, marginTop: space.md, marginBottom: 6 },
});
