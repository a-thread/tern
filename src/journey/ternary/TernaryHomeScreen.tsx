import React from 'react';

import { FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { flock, Presence } from '@/domain/ternary/models/ternary';
import { promptFor, restingAt } from '@/domain/ternary/models/stopover';
import { useTernaryNavigation } from '../../navigation/useAppNavigation';
import { TernaryPage } from './components/TernaryPage/TernaryPage';
import { StartTernary } from './components/StartTernary/StartTernary';
import { FlockMap } from './components/FlockMap/FlockMap';
import { BringFish } from './components/BringFish/BringFish';

/**
 * Your ternary: the shared bird and who's flying with it today, fish, and the way to the
 * stopover table, postcards and the ternary's settings. Out of a ternary, starting or joining
 * one. Only the friends who are here are listed; nobody is ever shown as missing.
 */
export default function TernaryHomeScreen() {
  const { available, ternary } = useTernary();
  const { settings } = useSettings();
  const navigation = useTernaryNavigation();

  if (!available) {
    return (
      <TernaryPage title='Ternary'>
        <FootNote>
          Ternaries come with Tern Plus and an account, since friends fly together
          through Tern’s server.
        </FootNote>
      </TernaryPage>
    );
  }
  if (!ternary) {
    return (
      <TernaryPage title='Fly with friends'>
        <StartTernary />
      </TernaryPage>
    );
  }

  const here = flock(ternary.members);
  const stop = restingAt(ternary.total);
  return (
    <TernaryPage title={ternary.name} top={<FlockMap />}>
      <GroupLabel>Flying today</GroupLabel>
      <Group>
        {here.length ? (
          here.map((m) => (
            <Row
              key={m.userId}
              title={m.you ? 'You' : m.name}
              value={m.presence === Presence.Resting ? 'Resting' : 'Here'}
            />
          ))
        ) : (
          <Row title='Nobody yet today' sub='Whoever shows up will fly here' />
        )}
      </Group>

      <BringFish />

      <GroupLabel>Together</GroupLabel>
      <Group>
        {settings.hideFriendsFood ? null : (
          <Row
            title='Stopover table'
            sub={
              stop
                ? `${stop.name}: ${promptFor(stop.id)}`
                : 'Opens when your shared bird reaches its first stop'
            }
            chevron
            onPress={() => navigation.navigate('StopoverTable')}
          />
        )}
        <Row
          title='Postcards'
          sub='From the stops on each of your own journeys'
          chevron
          onPress={() => navigation.navigate('Postcards')}
        />
        <Row
          title='Ternary settings'
          sub='What you share, inviting friends, leaving'
          chevron
          onPress={() => navigation.navigate('TernarySettings')}
        />
      </Group>
    </TernaryPage>
  );
}
