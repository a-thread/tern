import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '@shared/theme';
import { Card, GroupLabel, Icon, IconBadge } from '@shared/components/ui';
import { SettingsPage } from '../components/SettingsPage';
import { TipJar } from './components/TipJar/TipJar';
import { SupporterRow } from './components/SupporterRow/SupporterRow';
import { Letter } from './components/Letter/Letter';

/**
 * Settings › About Tern: what Tern is for and the promises it keeps, a letter from the person
 * who makes it, and ways to support it. A Supporter's plan is under Your data, and their
 * trail colour is chosen on Journey, where it's drawn.
 */
export default function AboutScreen() {
  return (
    <SettingsPage title='About Tern'>
      <Card>
        <Text style={typography.heading}>
          A kinder tracker, built for the long haul
        </Text>
        <Text style={s.para}>
          Tern is named for the Arctic tern, the bird with the longest migration
          on Earth. Each day you show up, yours flies a little further.
        </Text>
      </Card>

      <GroupLabel>What Tern promises</GroupLabel>
      <Card>
        <Text style={s.line}>
          • Rewarded for what you do, never for the scale or a calorie count.
        </Text>
        <Text style={s.line}>• Rest days count as showing up.</Text>
        <Text style={s.line}>
          • Hide the numbers, or turn weight, streaks and goals off, free.
        </Text>
        <Text style={s.line}>
          • No ads, no account needed, your data never sold.
        </Text>
        <Text style={s.line}>• A tracking tool, not medical advice.</Text>
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
    </SettingsPage>
  );
}

const s = StyleSheet.create({
  maker: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  para: { ...typography.meta, lineHeight: 19, marginTop: space.sm },
  line: { ...typography.meta, lineHeight: 19, marginTop: space.xs },
});
