import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { space, typography } from '@shared/theme';
import { Card, FootNote, GroupLabel } from '@shared/components/ui';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';

/**
 * What a ternary is for, in plain words: each part, the real tern behaviour it comes from,
 * and what friends can and can't see.
 */
export default function AboutTernaryScreen() {
  return (
    <TernaryPage title='What’s a ternary?'>
      <Text style={s.lead}>
        A ternary is a few friends who fly one shared bird together. It’s about
        keeping each other company, never about keeping up: nobody is ranked, and
        nobody is ever shown as behind.
      </Text>

      <GroupLabel>The shared bird</GroupLabel>
      <Card>
        <Text style={s.para}>
          {`Each day, the shared bird flies further the more of you show up. A rest day counts. On a day everyone shows up it flies ${TernaryRules.SHOW_UP_POINTS} waypoints, so a ternary flies the whole migration in about a year, whatever its size. A quiet day only slows it down: it never moves back.`}
        </Text>
        <Text style={s.para}>
          {`When it reaches a stop, everyone gets ${TernaryRules.ARRIVAL_POINTS} waypoints on their own journey, at most once a week.`}
        </Text>
      </Card>

      <GroupLabel>Flying together</GroupLabel>
      <Card>
        <Text style={s.para}>
          Arctic terns migrate in small, loose flocks. Whoever shows up today flies
          in a cluster around the shared bird, and the flock starts fresh every
          morning. A friend who isn’t here today simply isn’t drawn.
        </Text>
      </Card>

      <GroupLabel>Fish</GroupLabel>
      <Card>
        <Text style={s.para}>
          {`Terns court and feed each other by bringing fish. You can bring up to ${TernaryRules.MAX_FISH_PER_DAY} a day, to anyone in your ternary. A fish waits for your friend without a notification, and it’s only kindness: it earns no waypoints.`}
        </Text>
      </Card>

      <GroupLabel>Postcards</GroupLabel>
      <Card>
        <Text style={s.para}>
          When your own tern reaches a stop, you can send your ternary a postcard of
          the place, with a fact about it. It never shows a date, a total or how long
          the trip took.
        </Text>
      </Card>

      <GroupLabel>The stopover table</GroupLabel>
      <Card>
        <Text style={s.para}>
          Terns feed up together at stopovers. Each time the shared bird reaches a
          stop, a table opens with a prompt, like “Bring something warming”. You can
          bring one dish from your saved meals: only the foods are shared, never
          amounts or numbers. Past tables become your ternary’s recipe box.
        </Text>
      </Card>

      <GroupLabel>What friends see</GroupLabel>
      <Card>
        <Text style={s.para}>
          Only that you showed up today, “resting” if you choose to share that, and
          what you send. Never what you ate, weighed or walked, your streak, or your
          own journey. Fly privately and you’re never drawn at all, while still
          carrying the bird.
        </Text>
      </Card>
      <FootNote>
        Everyone in a ternary has Tern Plus. You can take a break, block someone
        silently or leave from Ternary settings, and you keep every waypoint you
        earned.
      </FootNote>
    </TernaryPage>
  );
}

const s = StyleSheet.create({
  lead: { ...typography.meta, lineHeight: 19, marginTop: space.md },
  para: { ...typography.meta, lineHeight: 19, marginTop: space.xs },
});
