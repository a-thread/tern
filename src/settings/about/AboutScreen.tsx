import React from 'react';
import { Linking, StyleSheet, Text } from 'react-native';

import { space, typography } from '@shared/theme';
import {
  Card,
  FootNote,
  Group,
  GroupLabel,
  Row,
} from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { TrailColors } from '@/domain/settings/models/trailColor';
import { SettingsPage } from '../components/SettingsPage';
import { SupportTern } from './models/supportTern';
import { TrailChoice } from './components/TrailChoice/TrailChoice';
import { TipJar } from './components/TipJar/TipJar';

/**
 * Settings › About Tern: what Tern is for and the promises it keeps, ways to support it, and
 * a Supporter's trail colour.
 */
export default function AboutScreen() {
  const { supporter } = useSubscription();
  const toast = useToast();

  const openCoffee = () =>
    Linking.openURL(SupportTern.COFFEE_URL).catch(() =>
      toast.show('Couldn’t open the page. It’s buymeacoffee.com/athread.'),
    );

  return (
    <SettingsPage title='About Tern'>
      <Card>
        <Text style={typography.heading}>A kinder tracker, built for the long haul</Text>
        <Text style={s.para}>
          Tern is named for the Arctic tern, the bird with the longest migration
          on Earth. Each day you show up, your tern flies a little further. Move
          when you can, log what sustains you, and rest when you need to.
        </Text>
      </Card>

      <GroupLabel>What Tern promises</GroupLabel>
      <Card>
        <Text style={s.line}>
          • Rewards are for what you do and the goals you set, never for a number
          on the scale or staying under a calorie count.
        </Text>
        <Text style={s.line}>
          • Rest days count as showing up. Nothing scolds you for a quiet day.
        </Text>
        <Text style={s.line}>
          • You can hide numbers, and turn off weight, streaks and goals. Those
          safeguards are always free.
        </Text>
        <Text style={s.line}>
          • No ads, and your data is never sold. Everything works on your phone
          with no account.
        </Text>
        <Text style={s.line}>
          • Tern is a tracking tool, not medical advice.
        </Text>
      </Card>

      <GroupLabel>Support Tern</GroupLabel>
      <TipJar />
      {SupportTern.showCoffee() ? (
        <Group>
          <Row
            title='Buy me a coffee'
            sub='A one-off thank-you, outside the app (test builds only)'
            chevron
            onPress={openCoffee}
          />
        </Group>
      ) : null}
      <FootNote>
        Tern is made by one person in their off hours. A tip is a one-off
        thank-you and unlocks nothing. Tern Plus keeps Tern running, with an
        account that keeps your log on every phone you sign in to.
      </FootNote>

      {supporter ? (
        <>
          <GroupLabel>Your tern’s trail</GroupLabel>
          <Group>
            {TrailColors.ALL.map((trail) => (
              <TrailChoice key={trail} trail={trail} />
            ))}
          </Group>
          <FootNote>
            A thank-you for supporting Tern: the line your tern has flown on
            Journey. It’s yours to keep if Supporter ends, and comes back if you
            support again.
          </FootNote>
        </>
      ) : null}
    </SettingsPage>
  );
}

const s = StyleSheet.create({
  para: { ...typography.meta, lineHeight: 19, marginTop: space.sm },
  line: { ...typography.meta, lineHeight: 19, marginTop: space.xs },
});
