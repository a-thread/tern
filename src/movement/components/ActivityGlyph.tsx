import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@shared/theme';
import { Activity } from '@movement/models/movementEntry';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** The Material Community Icons picture for each exercise. */
const ICONS: Record<Activity, IconName> = {
  [Activity.Walk]: 'walk',
  [Activity.Run]: 'run-fast',
  [Activity.Hike]: 'hiking',
  [Activity.Bike]: 'bike',
  [Activity.Swim]: 'swim',
  [Activity.Strength]: 'weight-lifter',
  [Activity.Cleaning]: 'broom',
  [Activity.Shoveling]: 'snowflake',
  [Activity.Gardening]: 'sprout',
  [Activity.Dancing]: 'dance-ballroom',
  [Activity.Rowing]: 'rowing',
  [Activity.Kayaking]: 'kayaking',
  [Activity.Elliptical]: 'stairs-up',
  [Activity.Hiit]: 'lightning-bolt',
  [Activity.Circuit]: 'timer-sync',
  [Activity.Yoga]: 'yoga',
  [Activity.Pilates]: 'spa-outline',
  [Activity.Stretching]: 'human-handsup',
  [Activity.Aerobics]: 'jump-rope',
  [Activity.Boxing]: 'boxing-glove',
  [Activity.MartialArts]: 'karate',
  [Activity.Basketball]: 'basketball',
  [Activity.Soccer]: 'soccer',
  [Activity.Tennis]: 'tennis',
  [Activity.Pickleball]: 'table-tennis',
  [Activity.Volleyball]: 'volleyball',
  [Activity.Golf]: 'golf',
  [Activity.Climbing]: 'carabiner',
  [Activity.Skiing]: 'ski',
  [Activity.Skating]: 'rollerblade',
  [Activity.Other]: 'dots-horizontal',
};

/** An exercise's icon, in the movement color. Unknown ids show Other's. */
export function ActivityGlyph({
  activity,
  size = 22,
  color = colors.glacierDeep,
}: {
  activity: Activity;
  size?: number;
  color?: string;
}) {
  return <MaterialCommunityIcons name={ICONS[activity] ?? ICONS[Activity.Other]} size={size} color={color} />;
}
