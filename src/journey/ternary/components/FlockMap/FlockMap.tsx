import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients, radius, space, typography } from '@shared/theme';
import { useTernary } from '@/domain/ternary/TernaryContext';
import {
  flockWithLooks,
  Presence,
  routeOf,
} from '@/domain/ternary/models/ternary';
import { restingAt } from '@/domain/ternary/models/stopover';
import { migrationProgress } from '@/domain/waypoints/models/milestone';
import { JourneyMap } from '@/journey/components/JourneyMap/JourneyMap';
import { ArrivalBird } from './components/ArrivalBird/ArrivalBird';

/**
 * The shared bird on its route, with whoever showed up today flying around it. Starts fresh
 * every morning; a friend who isn't here today simply isn't drawn.
 */
export function FlockMap({
  arriving,
  onArrived,
}: {
  /** Just joined or started: your bird glides in once. */
  arriving?: boolean;
  onArrived?: () => void;
}) {
  const { ternary } = useTernary();
  if (!ternary) return null;
  const route = routeOf(ternary);
  const { progress, lap } = migrationProgress(ternary.total, route);
  const stop = restingAt(ternary.total, route);
  const you = ternary.members.find((m) => m.you);
  return (
    <LinearGradient colors={[...gradients.journey]} style={s.sky}>
      <View>
        <JourneyMap
          progress={progress}
          lap={lap}
          route={route}
          flock={flockWithLooks(ternary.members).map(({ member, look }) => ({
            name: member.you ? 'You' : member.name,
            resting: member.presence === Presence.Resting,
            look,
          }))}
        />
        {arriving && you ? (
          <ArrivalBird look={you.look} onDone={() => onArrived?.()} />
        ) : null}
      </View>
      <Text style={s.caption}>
        {stop
          ? `Your shared bird, last stopped at ${stop.name}. Whoever shows up today flies beside it.`
          : 'Your shared bird, on its way to the first stop. Whoever shows up today flies beside it.'}
      </Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  sky: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    paddingBottom: space.md,
    marginTop: space.md,
  },
  caption: {
    ...typography.meta,
    color: colors.onDarkSoft,
    lineHeight: 18,
    paddingHorizontal: space.md,
    marginTop: space.sm,
  },
});
