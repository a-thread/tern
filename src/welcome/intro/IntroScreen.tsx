import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import TernMark from '@shared/components/TernMark';
import { useAuth } from '@/domain/auth/AuthContext';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { useWizard } from '../hooks/useWizard';
import { WizardStep as Step } from '../models/wizardSteps';

/** Tern's promises, each in the colour of what it's about (docs/design.md). */
const PROMISES = [
  {
    key: 'waypoints',
    // The tern mark, as on the waypoints chip.
    icon: <TernMark size={24} color={colors.violet} />,
    tint: colors.violetTint,
    text: 'Waypoints for logging, moving and resting',
  },
  {
    key: 'rest',
    icon: <Icon name='weather-night' size={18} color={colors.driftwood} />,
    tint: colors.driftwoodTint,
    text: 'Rest days keep your streak going',
  },
  {
    key: 'no-guilt',
    icon: <Icon name='heart-outline' size={18} color={colors.aurora} />,
    tint: colors.auroraTint,
    text: 'No guilt: going over a target is never flagged',
  },
];

/** The first screen: what Tern promises, and the ways out (skip, or sign in to an account). */
export default function IntroScreen() {
  const wizard = useWizard(Step.Intro);
  const auth = useAuth();

  return (
    <WizardStep
      step={Step.Intro}
      center
      hero={
        // The app icon's artwork, pre-cropped (as on the sign-in screens) so the 2000px
        // adaptive icon isn't decoded just to be shown small.
        <Image
          source={require('../../../assets/logo-header.png')}
          style={s.mark}
          resizeMode='contain'
          accessibilityLabel='Tern'
        />
      }
      title='Progress at your pace'
      body='A minute of setup, then Today is yours.'
      primary={{ label: 'Get started', onPress: wizard.next }}
      skip={{ label: 'Skip setup', onPress: () => wizard.finish() }}
      // Signing in loads the account's own settings, which have already been set up. Either
      // way the account question has been answered, so it isn't asked again later on.
      secondary={
        auth
          ? {
              label: 'I already have an account',
              onPress: () => wizard.answerAccount(() => auth.openSignIn()),
            }
          : undefined
      }
    >
      <View style={s.promises}>
        {PROMISES.map((p) => (
          <View key={p.key} style={s.promise}>
            <View style={[s.badge, { backgroundColor: p.tint }]}>{p.icon}</View>
            <Text style={s.promiseText}>{p.text}</Text>
          </View>
        ))}
      </View>
    </WizardStep>
  );
}

const s = StyleSheet.create({
  mark: {
    alignSelf: 'center',
    width: 240,
    height: 142,
    marginBottom: space.lg,
  },
  promises: {
    gap: space.md,
    marginTop: space.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  promise: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseText: { ...typography.rowTitle, flex: 1, lineHeight: 19 },
});
