import React from 'react';

import { Group, ToggleRow } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { describeReminders } from '@/domain/settings/models/reminderPlan';
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
  // The real schedule, as Settings › Reminders words it.
  const when = describeReminders(reminders, settings.weighInFrequency);

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
        {settings.trackFood ? (
          <ToggleRow
            title='Meal reminders'
            sub={`${when.meals}, if a meal is still open`}
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
        ) : null}
        {settings.trackWeight ? (
          <ToggleRow
            title='Weigh-in reminder'
            sub={when.weighIn}
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
