import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, font, space, typography } from '@shared/theme';
import { Card, GroupLabel } from '@shared/components/ui';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { fishable } from '@/domain/ternary/models/ternary';
import { useInvite } from '../../hooks/useInvite';
import { ButtonTone, TernaryButton } from '../TernaryButton/TernaryButton';

/** While nobody else has joined: your code, and a button to send it to friends. */
export function InviteCard() {
  const { ternary } = useTernary();
  const invite = useInvite();
  if (!ternary || fishable(ternary.members).length) return null;
  return (
    <>
      <GroupLabel>Invite your friends</GroupLabel>
      <Card>
        <Text style={s.lead}>
          {`It’s just you in ${ternary.name} so far. Send friends your code and they can join from Journey.`}
        </Text>
        <Text
          style={s.code}
          accessibilityLabel={`Invite code ${ternary.inviteCode.split('').join(' ')}`}
          selectable
        >
          {ternary.inviteCode}
        </Text>
        <TernaryButton
          label='Share invite'
          tone={ButtonTone.Aurora}
          onPress={invite}
        />
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  lead: { ...typography.meta, lineHeight: 19 },
  code: {
    fontFamily: font.bold,
    fontSize: 26,
    letterSpacing: 6,
    color: colors.ink,
    textAlign: 'center',
    marginTop: space.md,
  },
});
