import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { space, typography } from '@shared/theme';
import { Card, FootNote, GroupLabel } from '@shared/components/ui';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import { Bullet } from '../components/Bullet/Bullet';

/**
 * What a ternary is and why you'd want one, in a screenful: friends who keep each other
 * going without seeing what each other tracks, what you can do together, and what they see.
 */
export default function AboutTernaryScreen() {
  return (
    <TernaryPage title='What’s a ternary?'>
      <Text style={s.lead}>
        Accountability buddies, without sharing the details. A ternary is a few
        friends who fly one shared bird together: it goes further the more of
        you show up each day, and nobody is ranked or shown as behind.
      </Text>

      <GroupLabel>Together you can</GroupLabel>
      <Card>
        <Bullet first>
          {`Carry the shared bird. A rest day counts, and when it reaches a stop you each get ${TernaryRules.ARRIVAL_POINTS} waypoints.`}
        </Bullet>
        <Bullet>
          {`Cheer each other on with fish (up to ${TernaryRules.MAX_FISH_PER_DAY} a day) and postcards from the stops your own tern reaches.`}
        </Bullet>
        <Bullet>
          Swap recipes from your saved meals, and keep the ones you’d like to
          cook. Only names and foods, never amounts.
        </Bullet>
      </Card>

      <GroupLabel>What friends see</GroupLabel>
      <Card>
        <Text style={s.para}>
          That you showed up today, and what you send. Never what you ate,
          weighed or walked, your streak, or how far your own tern has flown.
          Fly privately and you’re not drawn at all.
        </Text>
      </Card>
      <FootNote>
        Everyone in a ternary has Tern Plus. You can be in one at a time, and
        take a break or leave whenever you like, keeping every waypoint.
      </FootNote>
    </TernaryPage>
  );
}

const s = StyleSheet.create({
  lead: { ...typography.meta, lineHeight: 19, marginTop: space.md },
  para: { ...typography.meta, lineHeight: 19 },
});
