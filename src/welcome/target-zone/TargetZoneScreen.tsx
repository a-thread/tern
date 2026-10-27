import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { FootNote, Group, Row } from '@shared/components/ui';
import { ZoneStepper } from '@shared/components/ZoneStepper/ZoneStepper';
import { useSettings } from '@/domain/settings/SettingsContext';
import { resolveZone, zoneScale } from '@/domain/food/models/intakeZone';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { WizardStep as Step } from '../models/wizardSteps';

/** The intake bars' zone, with a preview of where it sits. Skipped, it keeps following the target. */
export default function TargetZoneScreen() {
  const { settings } = useSettings();
  const zone = resolveZone(settings.calorieZone, settings.calorieTarget);
  const { zoneStart, zoneEnd } = zoneScale(0, zone);

  return (
    <WizardStep
      step={Step.TargetZone}
      title='Your target zone'
      body='The range shown on your intake bars. Anywhere inside it is a good day, and going over is never flagged.'
    >
      <View
        style={s.preview}
        accessible
        accessibilityLabel={`Zone from ${zone.min.toLocaleString()} to ${zone.max.toLocaleString()} calories`}
      >
        <Text
          style={[s.zoneLabel, { left: `${zoneStart * 100}%` }]}
        >{`${zone.min.toLocaleString()}–${zone.max.toLocaleString()}`}</Text>
        <View style={s.track}>
          <View
            style={[
              s.zone,
              {
                left: `${zoneStart * 100}%`,
                width: `${(zoneEnd - zoneStart) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <Group>
        <Row title='Low' right={<ZoneStepper end='min' zone={zone} />} />
        <Row title='High' right={<ZoneStepper end='max' zone={zone} />} />
      </Group>
      <FootNote>
        It starts 15% either side of your target. Skip to keep it following your
        target.
      </FootNote>
    </WizardStep>
  );
}

const s = StyleSheet.create({
  preview: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: space.md + 1,
    paddingTop: space.xl + 4,
    paddingBottom: space.lg,
    marginVertical: space.lg,
  },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.doveTint },
  zone: {
    position: 'absolute',
    top: -3,
    height: 14,
    borderRadius: 5,
    backgroundColor: colors.auroraTint,
  },
  zoneLabel: {
    ...typography.small,
    color: colors.aurora,
    position: 'absolute',
    top: space.sm,
    marginLeft: space.md + 1,
  },
});
