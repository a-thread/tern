import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, space, typography } from '@shared/theme';
import { FootNote } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useTernaryNavigation } from '@/navigation/useAppNavigation';
import { useTernary } from '@/domain/ternary/TernaryContext';
import {
  cleanInviteCode,
  cleanTernaryName,
  JoinOutcome,
  TernaryRules,
} from '@/domain/ternary/models/ternary';
import type { TernaryStackParamList } from '../navigation';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import { TernaryField } from '../components/TernaryField/TernaryField';
import { TernaryButton } from '../components/TernaryButton/TernaryButton';
import { YouFields } from '../components/YouFields/YouFields';
import { useYou } from '../hooks/useYou';

const JOIN_MESSAGES: Record<JoinOutcome, string | null> = {
  [JoinOutcome.Joined]: null,
  [JoinOutcome.NotFound]:
    'No ternary has that code. Check it with whoever sent it.',
  [JoinOutcome.Full]: 'That ternary is full.',
  [JoinOutcome.Already]: 'You’re already in a ternary.',
};

/** Joining a friend's ternary: its code first (filled in from a join link), then you. */
export default function JoinTernaryScreen({
  route,
}: Partial<NativeStackScreenProps<TernaryStackParamList, 'JoinTernary'>>) {
  const { join } = useTernary();
  const toast = useToast();
  const navigation = useTernaryNavigation();
  const you = useYou();
  const linked = route?.params?.code ?? '';
  const [code, setCode] = useState(linked);
  // A second link while this is open brings its own code.
  useEffect(() => {
    if (linked) setCode(linked);
  }, [linked]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinIt = async () => {
    const cleaned = cleanInviteCode(code);
    const yourName = cleanTernaryName(you.name);
    if (cleaned.length !== TernaryRules.INVITE_LENGTH) {
      return setError(
        `Invite codes are ${TernaryRules.INVITE_LENGTH} letters and numbers.`,
      );
    }
    if (!yourName) return setError('Add your name.');
    setError(null);
    setBusy(true);
    try {
      const outcome = await join(cleaned, yourName, you.look);
      if (outcome === JoinOutcome.Joined) {
        navigation.popTo('TernaryHome', { arrived: true });
      } else {
        setError(JOIN_MESSAGES[outcome]);
      }
    } catch (e) {
      console.warn('Could not join a ternary', e);
      toast.show('Couldn’t reach Tern just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <TernaryPage title='Join a ternary'>
      <TernaryField
        label='Invite code'
        value={code}
        onChangeText={(v) => {
          setCode(v);
          setError(null);
        }}
        code
        maxLength={TernaryRules.INVITE_LENGTH + 2}
      />
      <FootNote>Ask whoever started the ternary for its code.</FootNote>
      <YouFields
        name={you.name}
        onName={(v) => {
          you.setName(v);
          setError(null);
        }}
        look={you.look}
        onLook={you.setLook}
      />
      {error ? (
        <Text style={s.error} accessibilityLiveRegion='polite'>
          {error}
        </Text>
      ) : null}
      <TernaryButton label='Join' onPress={joinIt} disabled={busy} />
    </TernaryPage>
  );
}

const s = StyleSheet.create({
  error: { ...typography.meta, color: colors.danger, marginBottom: space.sm },
});
