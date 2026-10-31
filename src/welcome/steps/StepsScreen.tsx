import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { Group, GroupLabel, Icon, IconBadge, Row } from '@shared/components/ui';
import { StepGoalSlider } from '@shared/components/StepGoalSlider/StepGoalSlider';
import { healthAppName } from '@shared/utils/healthApp';
import { useConnectHealth } from '@shared/hooks/useConnectHealth';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useActivity } from '@/domain/activity/ActivityContext';
import { StepsStatus } from '@/domain/activity/models/stepsStatus';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { WizardStep as Step } from '../models/wizardSteps';

/** Connecting the phone's health app, and a daily step goal (the same slider as Settings). */
export default function StepsScreen() {
  const { settings } = useSettings();
  const { status } = useActivity();
  const { busy, requestAccess } = useConnectHealth();
  const healthApp = healthAppName();
  const connected = status === StepsStatus.Connected;

  return (
    <WizardStep
      step={Step.Steps}
      title='Steps come from your phone'
      body={
        settings.trackMovement
          ? `Tern reads your steps and workouts from ${healthApp}, and never shares them.`
          : `Tern reads your steps from ${healthApp}, and never shares them.`
      }
    >
      <Group style={s.group}>
        <Row
          title={healthApp}
          sub={connected ? 'Connected' : 'Count steps without typing them in'}
          icon={
            <IconBadge bg={colors.glacierTint}>
              <Icon name='heart-pulse' size={16} color={colors.glacierDeep} />
            </IconBadge>
          }
          right={
            connected ? null : (
              <Pressable
                onPress={requestAccess}
                disabled={busy}
                hitSlop={8}
                accessibilityRole='button'
                accessibilityLabel={`Connect ${healthApp}`}
              >
                <Text style={s.connect}>Connect</Text>
              </Pressable>
            )
          }
        />
      </Group>

      <GroupLabel>Daily step goal</GroupLabel>
      <StepGoalSlider />
    </WizardStep>
  );
}

const s = StyleSheet.create({
  connect: { fontFamily: font.semibold, fontSize: 13.5, color: colors.coral },
  group: { marginTop: space.md },
});
