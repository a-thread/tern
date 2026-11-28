import React from 'react';

import { colors } from '@shared/theme';
import {
  Card,
  FootNote,
  GroupLabel,
  Icon,
  IconBadge,
} from '@shared/components/ui';
import type { IconName } from '@shared/components/ui/Icon';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import { Bullet } from '../components/Bullet/Bullet';
import { SettingsLink } from './components/SettingsLink/SettingsLink';
import { Feature } from './components/Feature/Feature';
import { FlockPicture } from './components/FlockPicture/FlockPicture';

const SEEN: IconName = 'eye-outline';
const HIDDEN: IconName = 'eye-off-outline';

/** A feature's picture: its icon on a soft tint of its colour, as on Journey's rows. */
const badge = (name: IconName, bg: string, color: string) => (
  <IconBadge bg={bg} size={40}>
    <Icon name={name} size={22} color={color} />
  </IconBadge>
);

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
        <Feature first picture={<FlockPicture />} title='Fly one bird together'>
          <Bullet first>
            Each day you show up, resting or otherwise, your shared bird flies
            further.
          </Bullet>
          <Bullet>
            {`When your shared bird reaches a new stop, everyone gets ${TernaryRules.ARRIVAL_POINTS} waypoints!`}
          </Bullet>
        </Feature>
        <Feature
          picture={badge('fish', colors.sunTint, colors.sunDeep)}
          title='Send fish'
        >
          {`Send each other up to ${TernaryRules.MAX_FISH_PER_DAY} fish a day, for encouragement as you all work towards your goals.`}
        </Feature>
        <Feature
          picture={badge(
            'email-outline',
            colors.glacierTint,
            colors.glacierDeep,
          )}
          title='Send postcards'
        >
          When your own bird reaches a new stop, send a postcard about the place
          you’ve reached.
        </Feature>
        <Feature
          picture={badge('silverware-fork-knife', colors.kelpTint, colors.kelp)}
          title='Swap meals'
        >
          <Bullet first>
            Share your saved meals with the people in your ternary. Recipes go
            with their amounts.
          </Bullet>
          <Bullet>
            Save a friend’s meal to your own, ready to log without working out
            amounts.
          </Bullet>
        </Feature>
      </Card>

      <GroupLabel>What friends can see</GroupLabel>
      <Card>
        <Bullet first icon={SEEN} iconColor={colors.kelp}>
          That you showed up today
        </Bullet>
        <Bullet icon={SEEN} iconColor={colors.kelp}>
          That you’re resting, if you <SettingsLink>turn that on</SettingsLink>
        </Bullet>
        <Bullet icon={SEEN} iconColor={colors.kelp}>
          The fish, postcards and meals you send
        </Bullet>
      </Card>

      <GroupLabel>What friends never see</GroupLabel>
      <Card>
        <Bullet first icon={HIDDEN}>
          What you eat or weigh
        </Bullet>
        <Bullet icon={HIDDEN}>How much you walk or exercise</Bullet>
        <Bullet icon={HIDDEN}>
          Your streak, or how far your own bird has flown (other than any
          postcards you choose to send)
        </Bullet>
        <Bullet icon={HIDDEN}>
          Calories or nutrition in the meals you share, or how much you ate
        </Bullet>
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
