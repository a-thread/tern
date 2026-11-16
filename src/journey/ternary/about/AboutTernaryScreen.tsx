import React from 'react';

import { Card, FootNote, GroupLabel } from '@shared/components/ui';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import { Bullet } from '../components/Bullet/Bullet';

/**
 * How a ternary works, for someone who has never used anything like it: what you can do
 * together, what friends can see, and what they never see. Short sentences and everyday
 * words; what a ternary is and why you'd want one is on Fly with friends.
 */
export default function AboutTernaryScreen() {
  return (
    <TernaryPage title='How does it work?'>
      <GroupLabel>What you can do together</GroupLabel>
      <Card>
        <Bullet first>
          Fly one bird together. Each day you show up, it flies further. A rest
          day counts too.
        </Bullet>
        <Bullet>
          {`When it reaches a new place, everyone gets ${TernaryRules.ARRIVAL_POINTS} waypoints.`}
        </Bullet>
        <Bullet>
          {`Send a fish to say you’re thinking of someone. You can send ${TernaryRules.MAX_FISH_PER_DAY} a day.`}
        </Bullet>
        <Bullet>
          When your own bird reaches a new place, send a postcard from there.
        </Bullet>
        <Bullet>
          Share a meal you’ve saved. Friends can keep it to cook later.
        </Bullet>
      </Card>

      <GroupLabel>What friends can see</GroupLabel>
      <Card>
        <Bullet first>That you showed up today</Bullet>
        <Bullet>That you’re resting, if you turn that on</Bullet>
        <Bullet>The fish, postcards and meals you send</Bullet>
      </Card>

      <GroupLabel>What friends never see</GroupLabel>
      <Card>
        <Bullet first>What you eat or weigh</Bullet>
        <Bullet>How much you walk or exercise</Bullet>
        <Bullet>Your streak, or how far your own bird has flown</Bullet>
        <Bullet>Amounts or calories in the meals you share</Bullet>
      </Card>

      <FootNote>
        Want to stay off the map? Turn on Fly privately in Ternary settings. You
        can take a break or leave any time and keep all your waypoints. Everyone
        in a ternary has Tern Plus, and you can be in one at a time.
      </FootNote>
    </TernaryPage>
  );
}
