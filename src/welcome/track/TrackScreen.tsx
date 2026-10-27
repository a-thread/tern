import React from 'react';

import { colors } from '@shared/theme';
import {
  FootNote,
  Group,
  GroupLabel,
  Icon,
  IconBadge,
  type IconName,
  SegmentedControl,
  ToggleRow,
} from '@shared/components/ui';
import { Units } from '@shared/utils/units';
import { useSettings } from '@/domain/settings/SettingsContext';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { WizardStep as Step } from '../models/wizardSteps';

const UNITS: readonly Units[] = [Units.Imperial, Units.Metric];

/** A row's badge, in the colour of what it tracks (as in Settings). */
function Badge({
  name,
  color,
  tint,
}: {
  name: IconName;
  color: string;
  tint: string;
}) {
  return (
    <IconBadge bg={tint}>
      <Icon name={name} size={16} color={color} />
    </IconBadge>
  );
}

/**
 * The same tracking switches as Settings, and units. No name here: a name belongs to an
 * account, which asks for it when one is made (and Settings edits it once signed in).
 */
export default function TrackScreen() {
  const { settings, updateSettings } = useSettings();
  const food = settings.trackCalories || settings.trackMacros;

  return (
    <WizardStep
      step={Step.Track}
      title='What to keep track of'
      body='Pick a few. You can change all of this in Settings.'
    >
      <GroupLabel>Alongside your steps</GroupLabel>
      <Group>
        <ToggleRow
          title='Food'
          sub='Meals, with calories or without'
          icon={
            <Badge
              name='silverware-fork-knife'
              color={colors.kelp}
              tint={colors.kelpTint}
            />
          }
          on={food}
          onToggle={(v) => updateSettings({ trackCalories: v, trackMacros: v })}
        />
        <ToggleRow
          title='Weight'
          sub='Shown as a weekly trend'
          icon={
            <Badge
              name='scale-bathroom'
              color={colors.water}
              tint={colors.waterTint}
            />
          }
          on={settings.trackWeight}
          onToggle={(v) => updateSettings({ trackWeight: v })}
        />
        <ToggleRow
          title='Water'
          sub='Glasses through the day'
          icon={
            <Badge
              name='water-outline'
              color={colors.glacierDeep}
              tint={colors.glacierTint}
            />
          }
          on={settings.trackWater}
          onToggle={(v) => updateSettings({ trackWater: v })}
        />
        <ToggleRow
          title='Mood and stress'
          sub='A short daily check-in'
          icon={
            <Badge
              name='emoticon-happy-outline'
              color={colors.violet}
              tint={colors.violetTint}
            />
          }
          on={settings.trackMood}
          onToggle={(v) => updateSettings({ trackMood: v })}
        />
        <ToggleRow
          title='Movement'
          sub='Swims, rides, lifting and classes steps miss'
          icon={
            <Badge name='bike' color={colors.sunDeep} tint={colors.sunTint} />
          }
          on={settings.trackMovement}
          onToggle={(v) => updateSettings({ trackMovement: v })}
        />
      </Group>
      <FootNote>Steps are always counted.</FootNote>

      <GroupLabel>Units</GroupLabel>
      <SegmentedControl
        options={UNITS}
        value={settings.units}
        onChange={(units) => updateSettings({ units })}
        label={(u) =>
          u === Units.Imperial ? 'Pounds, ounces' : 'Kilograms, ml'
        }
      />
    </WizardStep>
  );
}
