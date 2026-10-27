import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useAuth } from '@/domain/auth/AuthContext';
import { WizardStep } from '../components/WizardStep/WizardStep';
import { useWizard } from '../hooks/useWizard';
import { WizardStep as Step } from '../models/wizardSteps';

const WHAT_AN_ACCOUNT_DOES = [
  {
    icon: 'cloud-check-outline',
    text: 'Synced and backed up, so a lost phone loses nothing',
  },
  { icon: 'cellphone-link', text: 'The same Tern on more than one phone' },
  { icon: 'lock-outline', text: 'Yours: no ads, and nothing sold' },
] as const;

/**
 * The invitation to make an account (which comes with Tern Plus), or sign in to one. Shown once:
 * "Keep on this phone" settles it (a real choice, not a dead end), and so does having an account.
 */
export default function AccountScreen() {
  const wizard = useWizard(Step.Account);
  const auth = useAuth();

  return (
    <WizardStep
      step={Step.Account}
      title='Keep your data safe'
      body='Tern works fully on this phone. An account, with Tern Plus, keeps it safe beyond it.'
      // These open over the wizard and leave it here, so backing out comes back to this screen.
      primary={{
        label: 'Create an account',
        onPress: () => auth?.openSignIn({ toSignUp: true }),
      }}
      secondary={{
        label: 'I already have an account',
        onPress: () => auth?.openSignIn(),
      }}
      // Either way out settles the question, so it isn't asked again.
      skip={{ label: 'Skip', onPress: () => wizard.answerAccount() }}
      tertiary={{
        label: 'Keep on this phone',
        onPress: () => wizard.answerAccount(),
      }}
    >
      <View style={s.list}>
        {WHAT_AN_ACCOUNT_DOES.map(({ icon, text }) => (
          <View key={icon} style={s.row}>
            <View style={s.badge}>
              <Icon name={icon} size={18} color={colors.water} />
            </View>
            <Text style={s.text}>{text}</Text>
          </View>
        ))}
      </View>
    </WizardStep>
  );
}

const s = StyleSheet.create({
  // A white card, like the promises on the welcome screen.
  list: {
    gap: space.md,
    marginTop: space.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.waterTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { ...typography.rowTitle, flex: 1 },
});
