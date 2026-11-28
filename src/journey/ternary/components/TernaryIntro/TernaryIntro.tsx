import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, typography } from '@shared/theme';
import { Card, FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useTernaryNavigation } from '@/navigation/useAppNavigation';
import { Bullet } from '../Bullet/Bullet';
import { TernaryButton } from '../TernaryButton/TernaryButton';
import { FlockDrift } from './components/FlockDrift/FlockDrift';

/** Out of a ternary: what one is and why you'd want one, then start one or join a friend's. */
export function TernaryIntro() {
  const navigation = useTernaryNavigation();
  return (
    <View>
      <FlockDrift />

      <GroupLabel>What’s a ternary?</GroupLabel>
      <Card>
        <Text style={s.pitch}>
          Accountability buddies, without sharing the details. Friends see that
          you showed up, never what you ate, weighed or walked.
        </Text>
        <Bullet>Carry one shared bird further together</Bullet>
        <Bullet>Cheer each other on with fish and postcards</Bullet>
        <Bullet>Swap recipes, ready to log</Bullet>
      </Card>
      <Group style={s.about}>
        <Row
          title='How does it work?'
          sub='What you can do together, and what friends see'
          chevron
          onPress={() => navigation.navigate('AboutTernary')}
        />
      </Group>

      <View style={s.actions}>
        <TernaryButton
          label='Start a ternary'
          onPress={() => navigation.navigate('StartTernary')}
        />
        <TernaryButton
          label='Join with a code'
          outline
          onPress={() => navigation.navigate('JoinTernary')}
        />
      </View>
      <FootNote>
        Everyone in a ternary has Tern Plus, and anyone can leave whenever they
        like.
      </FootNote>
    </View>
  );
}

const s = StyleSheet.create({
  pitch: { ...typography.meta, lineHeight: 19 },
  about: { marginTop: space.sm },
  actions: { marginTop: space.lg },
});
