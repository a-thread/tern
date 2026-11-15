import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '@shared/theme';
import {
  Card,
  FootNote,
  Group,
  GroupLabel,
  Icon,
  IconBadge,
} from '@shared/components/ui';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { TrailColors } from '@/domain/settings/models/trailColor';
import { SettingsPage } from '../components/SettingsPage';
import { TrailChoice } from './components/TrailChoice/TrailChoice';
import { TipJar } from './components/TipJar/TipJar';
import { SupporterRow } from './components/SupporterRow/SupporterRow';
import { Letter } from './components/Letter/Letter';

/**
 * Settings › About Tern: what Tern is for and the promises it keeps, a letter from the person
 * who makes it, ways to support it, and
 * a Supporter's trail colour.
 */
export default function AboutScreen() {
  const { supporter } = useSubscription();

  return (
    <SettingsPage title='About Tern'>
      <Card>
        <Text style={typography.heading}>
          A kinder tracker, built for the long haul
        </Text>
        <Text style={s.para}>
          Tern is named for the Arctic tern, the bird with the longest migration
          on Earth. Each day you show up, your tern flies a little further. Move
          when you can, log what sustains you, and rest when you need to.
        </Text>
      </Card>

      <GroupLabel>What Tern promises</GroupLabel>
      <Card>
        <Text style={s.line}>
          • Rewards are for what you do and the goals you set, never for a
          number on the scale or staying under a calorie count.
        </Text>
        <Text style={s.line}>
          • Rest days count as showing up. Take as few or as many as you need.
        </Text>
        <Text style={s.line}>
          • Hide the numbers, and turn weight, streaks and goals on or off.
          Those safeguards are always free.
        </Text>
        <Text style={s.line}>
          • No ads, no account needed, and your data is yours: never sold.
        </Text>
        <Text style={s.line}>
          • Tern is a tracking tool, not medical advice.
        </Text>
      </Card>

      <GroupLabel>A letter from Aiden</GroupLabel>
      <Letter />

      <GroupLabel>Support Tern</GroupLabel>
      <Card>
        <View style={s.maker}>
          <IconBadge bg={colors.sunTint}>
            <Icon name='feather' size={16} color={colors.sunDeep} />
          </IconBadge>
          <Text style={typography.heading}>Bring Tern a fish</Text>
        </View>
        <Text style={s.para}>
          If Tern has helped, you can leave a tip. A tip unlocks nothing.
        </Text>
        <TipJar />
      </Card>
      <SupporterRow />

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
  maker: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  para: { ...typography.meta, lineHeight: 19, marginTop: space.sm },
  line: { ...typography.meta, lineHeight: 19, marginTop: space.xs },
});
