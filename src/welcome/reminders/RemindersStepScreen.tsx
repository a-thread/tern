import React from 'react';

import { Group, ToggleRow } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { useWizard } from '../hooks/useWizard';
import { WizardStep as Step } from '../models/wizardSteps';

/**
 * The last screen: meal and weigh-in reminders. "Turn on reminders" lets the phone ask to send
 * notifications now that it's clear why; "Not now" finishes without asking.
 */
export default function RemindersStepScreen() {
  const { settings, updateSettings } = useSettings();
  const wizard = useWizard(Step.Reminders);
  const { reminders } = settings;

  return (
    <WizardStep
      step={Step.Reminders}
      title='A nudge now and then?'
      body='Reminders go quiet once something is done, and on rest days.'
      skip={null}
      primary={{
        label: 'Turn on reminders',
        onPress: () => wizard.finish(true),
      }}
      secondary={{ label: 'Not now', onPress: () => wizard.finish() }}
    >
      <Group>
        <ToggleRow
          title='Meal reminders'
          sub='Midday and evening, if a meal is still open'
          on={reminders.mealLog.on}
          onToggle={(on) =>
            updateSettings({
              reminders: {
                ...reminders,
                mealLog: { ...reminders.mealLog, on },
              },
            })
          }
        />
        {settings.trackWeight ? (
          <ToggleRow
            title='Weigh-in reminder'
            sub='Once a week, Monday morning'
            on={reminders.weighIn.on}
            onToggle={(on) =>
              updateSettings({
                reminders: {
                  ...reminders,
                  weighIn: { ...reminders.weighIn, on },
                },
              })
            }
          />
        ) : null}
      </Group>
    </WizardStep>
  );
}
