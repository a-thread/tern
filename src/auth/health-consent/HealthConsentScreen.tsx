import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, typography } from '@shared/theme';
import { AuthBanner } from '../components/AuthBanner';
import { AuthLayout } from '../components/AuthLayout';
import { LegalLinks } from '../components/LegalLinks/LegalLinks';
import { LinkButton } from '../components/LinkButton';
import { LinkColumn } from '../components/LinkColumn';
import { SubmitButton } from '../components/SubmitButton';
import { useSubmit } from '../hooks/useSubmit';

const WHAT_IS_KEPT = [
  'What you log: food, weigh-ins, water, movement, medication, mood and stress check-ins, and notes',
  'Kept on Tern’s server (Supabase), encrypted, and readable only by your account',
  'Used only to keep your log on every phone you sign in to. Never sold, never used for ads',
  'Withdraw any time in Settings › Account and data. A copy stays on this phone.',
];

/**
 * Asked before an account syncs anything: health data needs explicit consent (GDPR Art. 9).
 * Saying no keeps everything on the phone.
 */
export default function HealthConsentScreen({
  onAgree,
  onDecline,
}: {
  onAgree: () => Promise<void>;
  onDecline: () => void;
}) {
  const { busy, error, run } = useSubmit(
    "Couldn't reach Tern's server. Please try again.",
  );

  return (
    <AuthLayout
      showMark
      title='Keep your log in your account?'
      subtitle='To sync, Tern stores your health data on its server. It needs your OK first.'
    >
      <AuthBanner variant='error' message={error || null} />
      <View style={s.list}>
        {WHAT_IS_KEPT.map((line) => (
          <Text key={line} style={s.line}>
            {`•  ${line}`}
          </Text>
        ))}
      </View>
      <SubmitButton
        label='I agree'
        busyLabel='Saving…'
        busy={busy}
        disabled={false}
        onPress={() => run(onAgree)}
      />
      <Text style={s.fine}>
        Without it, your log stays on this phone and nothing is uploaded. Tern
        asks again next time you open it.
      </Text>
      <LegalLinks />
      <LinkColumn>
        <LinkButton label='Not now' onPress={onDecline} />
      </LinkColumn>
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  list: { gap: space.sm, marginBottom: space.lg },
  line: { ...typography.meta, lineHeight: 18 },
  fine: { ...typography.small, marginTop: space.md, lineHeight: 16 },
});
