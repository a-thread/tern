import React from 'react';

import { Card, FootNote, GroupLabel } from '@shared/components/ui';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import { Bullet } from '../components/Bullet/Bullet';
import { SettingsLink } from './components/SettingsLink/SettingsLink';

/**
 * How a ternary works, for someone who has never used anything like it: what you can do
 * together, what friends can see, and what they never see. Short sentences and everyday
 * words; what a ternary is and why you'd want one is on Fly with friends. The settings it
 * mentions are links, once you're in a ternary that has them.
 */
export default function AboutTernaryScreen() {
  return (
    <TernaryPage title='How does it work?'>
      <GroupLabel>What you can do together</GroupLabel>
      <Card>
        <Bullet first>Fly one bird together:</Bullet>
        <Bullet sub>
          Each day you show up, resting or otherwise, your shared bird flies
          further.
        </Bullet>
        <Bullet sub>
          {`When your shared bird reaches a new stop, everyone gets ${TernaryRules.ARRIVAL_POINTS} waypoints!`}
        </Bullet>
        <Bullet>
          {`Send each other up to ${TernaryRules.MAX_FISH_PER_DAY} fish a day, for encouragement as you all work towards your goals.`}
        </Bullet>
        <Bullet>
          When your own bird reaches a new stop, send a postcard about the place
          you’ve reached.
        </Bullet>
        <Bullet>Share your saved meals with the people in your ternary.</Bullet>
        <Bullet>Save meals other people have shared.</Bullet>
      </Card>

      <GroupLabel>What friends can see</GroupLabel>
      <Card>
        <Bullet first>That you showed up today</Bullet>
        <Bullet>
          That you’re resting, if you <SettingsLink>turn that on</SettingsLink>
        </Bullet>
        <Bullet>The fish, postcards and meals you send</Bullet>
      </Card>

      <GroupLabel>What friends never see</GroupLabel>
      <Card>
        <Bullet first>What you eat or weigh</Bullet>
        <Bullet>How much you walk or exercise</Bullet>
        <Bullet>
          Your streak, or how far your own bird has flown (other than any
          postcards you choose to send)
        </Bullet>
        <Bullet>Amounts or calories in the meals you share</Bullet>
      </Card>

      <FootNote>
        Want to stay off the map? Turn on{' '}
        <SettingsLink>Fly privately in Ternary settings</SettingsLink>. You can
        take a break or leave any time and keep all your waypoints. Everyone in
        a ternary has Tern Plus, and you can be in one at a time.
      </FootNote>
    </TernaryPage>
  );
}
