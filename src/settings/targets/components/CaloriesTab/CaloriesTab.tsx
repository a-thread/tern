import React from 'react';

import { FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { resolveZone } from '@/domain/food/models/intakeZone';
import { ZoneStepper } from '@shared/components/ZoneStepper/ZoneStepper';
import { CalorieTargetPicker } from '@shared/components/CalorieTargetPicker/CalorieTargetPicker';
import { AdaptiveTargetCard } from './components/AdaptiveTargetCard/AdaptiveTargetCard';

/** The Calories tab of Targets: the daily target, the intake-bar zone, and the adaptive suggestion. */
export function CaloriesTab() {
  const { settings } = useSettings();
  const zone = resolveZone(settings.calorieZone, settings.calorieTarget);

  return (
    <>
      <CalorieTargetPicker />
      {settings.trackMacros ? (
        <FootNote>
          Your macro percentages stay the same when you change calories.
        </FootNote>
      ) : null}

      {settings.showIntakeBars ? (
        <>
          <GroupLabel>Target zone</GroupLabel>
          <Group>
            <Row title='Low' right={<ZoneStepper end='min' zone={zone} />} />
            <Row title='High' right={<ZoneStepper end='max' zone={zone} />} />
          </Group>
          <FootNote>
            The range shown on your intake bars. It starts around your calorie
            target, and you can set your own.
          </FootNote>
        </>
      ) : null}

      <AdaptiveTargetCard />
    </>
  );
}
