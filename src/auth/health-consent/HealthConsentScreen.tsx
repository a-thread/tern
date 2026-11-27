import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { space, typography } from '@shared/theme';
import { AuthBanner } from '../components/AuthBanner';
import { AuthLayout } from '../components/AuthLayout';
import { type Bullet, BulletList } from '../components/BulletList/BulletList';
import { LegalLinks } from '../components/LegalLinks/LegalLinks';
import { SubmitButton } from '../components/SubmitButton';
import { useSubmit } from '../hooks/useSubmit';
import { SecondaryButton } from './components/SecondaryButton/SecondaryButton';

// Every kind of health data Tern stores must be named here, or the consent doesn't cover it.
const WHAT_IT_MEANS: Bullet[] = [
  {
    lead: 'Who:',
    text: 'Purlieus LLC, the Maine company that makes Tern, is responsible for your data.',
  },
  {
    lead: 'What:',
    text: 'food, weigh-ins, water, movement, medication, mood and stress, after-meal check-ins, and notes.',
  },
  {
    lead: 'Where:',
    text: 'Tern’s server (Supabase), encrypted. Other accounts can’t see it.',
  },
  {
    lead: 'Why:',
    text: 'only to sync your log. Never sold, never used for ads.',
  },
  {
    lead: 'Changing your mind:',
    text: 'any time, in Settings › Account and data. Your log moves back to this phone and is erased from the server.',
  },
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
      title='Health data consent'
      subtitle='Tern Plus keeps your log on every phone you sign in to. To do that, Tern stores your health data on its server, and needs your consent first.'
    >
      <AuthBanner variant='error' message={error || null} />
      <BulletList items={WHAT_IT_MEANS} />
      <SubmitButton
        label='Agree and sync'
        busyLabel='Saving…'
        busy={busy}
        disabled={false}
        onPress={() => run(onAgree)}
      />
      <SecondaryButton label='Not now' disabled={busy} onPress={onDecline} />
      <Text style={s.fine}>
        If you choose Not now, your log stays on this phone and nothing is
        uploaded. You can turn on sync later in Settings › Account and data.
      </Text>
      <LegalLinks />
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  fine: { ...typography.small, marginTop: space.md, lineHeight: 16 },
});
