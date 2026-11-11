import React from 'react';

import { colors } from '@shared/theme';
import { Group, GroupLabel, IconBadge, Icon, Row } from '@shared/components/ui';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { flock } from '@/domain/ternary/models/ternary';
import { useRootNavigation } from '../../../navigation/useAppNavigation';

/**
 * Your ternary on Journey: who's flying with the shared bird today, and any fish waiting.
 * Nothing at all without an account with Plus, or while taking a break from the ternary, so
 * it never nags. Out of a ternary, one quiet row to start or join one.
 */
export function TernaryCard() {
  const { available, ready, ternary, hidden } = useTernary();
  const navigation = useRootNavigation();
  if (!available || !ready || hidden) return null;

  if (!ternary) {
    return (
      <>
        <GroupLabel>Fly with friends</GroupLabel>
        <Group>
          <Row
            title='Start or join a ternary'
            sub='A few friends, one shared bird'
            icon={
              <IconBadge bg={colors.auroraTint}>
                <Icon name='feather' size={17} color={colors.aurora} />
              </IconBadge>
            }
            chevron
            onPress={() => navigation.navigate('Ternary')}
          />
        </Group>
      </>
    );
  }

  const flying = flock(ternary.members).map((m) => (m.you ? 'you' : m.name));
  const fish = ternary.fish.length;
  return (
    <>
      <GroupLabel>Your ternary</GroupLabel>
      <Group>
        <Row
          title={ternary.name}
          sub={
            [
              flying.length ? `Flying today: ${flying.join(', ')}` : 'Your shared bird',
              fish ? `${fish} fish for you` : null,
            ]
              .filter(Boolean)
              .join(' · ')
          }
          icon={
            <IconBadge bg={colors.auroraTint}>
              <Icon name='feather' size={17} color={colors.aurora} />
            </IconBadge>
          }
          chevron
          onPress={() => navigation.navigate('Ternary')}
        />
      </Group>
    </>
  );
}
