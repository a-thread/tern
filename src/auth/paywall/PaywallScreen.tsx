import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { space, typography } from '@shared/theme';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { AuthBanner } from '../components/AuthBanner';
import { AuthLayout } from '../components/AuthLayout';
import { LinkButton } from '../components/LinkButton';
import { LinkColumn } from '../components/LinkColumn';
import { SubmitButton } from '../components/SubmitButton';
import { useSubmit } from '../hooks/useSubmit';
import { PlanChoice } from './components/PlanChoice/PlanChoice';

const STORE = Platform.OS === 'ios' ? 'the App Store' : 'Google Play';

const WHAT_PLUS_ADDS = [
  'Your log synced to an account, so a lost phone loses nothing',
  'The same Tern on more than one phone',
  'An app with no ads and nothing sold, kept going',
];

/**
 * Tern Plus, before making an account. Everything else in Tern stays free, and leaving here
 * changes nothing. Once Plus is on (bought or restored) the flow moves on by itself.
 */
export default function PaywallScreen({ onBack }: { onBack: () => void }) {
  const { ready, plans, purchase, restore } = useSubscription();
  const [chosen, setChosen] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { busy, error, run } = useSubmit(
    `Couldn't reach ${STORE}. Please try again.`,
  );

  // The first plan (yearly when there is one) starts out chosen.
  useEffect(() => {
    if (!chosen && plans.length) setChosen(plans[0].id);
  }, [chosen, plans]);

  const buy = async () => {
    if (!chosen) return;
    setInfo(null);
    // Backing out of the store's sheet just leaves the paywall where it was.
    await run(async () => {
      await purchase(chosen);
    });
  };

  const restorePurchase = async () => {
    setInfo(null);
    let found = true;
    const ok = await run(async () => {
      found = await restore();
    });
    if (ok && !found) {
      setInfo(`No Tern Plus purchase was found on this ${STORE} account.`);
    }
  };

  const unavailable = ready && !plans.length;

  return (
    <AuthLayout
      showMark
      title='Tern Plus'
      subtitle='Everything in Tern stays free. Plus adds an account that keeps your log safe.'
    >
      <AuthBanner variant='error' message={error || null} />
      <AuthBanner
        variant='info'
        message={
          unavailable
            ? "Tern Plus can't be bought right now. Please try again later."
            : info
        }
      />

      <View style={s.list}>
        {WHAT_PLUS_ADDS.map((line) => (
          <Text key={line} style={s.line}>
            {`•  ${line}`}
          </Text>
        ))}
      </View>

      {plans.map((option) => (
        <PlanChoice
          key={option.id}
          option={option}
          chosen={option.id === chosen}
          onChoose={() => setChosen(option.id)}
        />
      ))}

      <SubmitButton
        label='Continue'
        busyLabel='Waiting for the store…'
        busy={busy}
        disabled={!chosen}
        onPress={buy}
      />
      <Text style={s.fine}>
        {`Paid through ${STORE}. Renews until you cancel in ${STORE}. If Plus ever ends, nothing is deleted: Tern keeps working on this phone.`}
      </Text>

      <LinkColumn>
        <LinkButton label='Restore a purchase' onPress={restorePurchase} />
        <LinkButton label='Not now' onPress={onBack} />
      </LinkColumn>
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  list: { gap: space.sm, marginBottom: space.lg },
  line: { ...typography.meta, lineHeight: 18 },
  fine: { ...typography.small, marginTop: space.md, lineHeight: 16 },
});
