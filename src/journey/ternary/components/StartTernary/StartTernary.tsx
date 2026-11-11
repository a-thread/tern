import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '@shared/theme';
import { Card, FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useTernaryNavigation } from '@/navigation/useAppNavigation';
import { useToast } from '@shared/state/ToastContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import {
  cleanInviteCode,
  cleanTernaryName,
  JoinOutcome,
  TernaryRules,
} from '@/domain/ternary/models/ternary';
import { TernaryField } from '../TernaryField/TernaryField';
import { TernaryButton } from '../TernaryButton/TernaryButton';

const JOIN_MESSAGES: Record<JoinOutcome, string | null> = {
  [JoinOutcome.Joined]: null,
  [JoinOutcome.NotFound]: 'No ternary has that code. Check it with whoever sent it.',
  [JoinOutcome.Full]: 'That ternary is full.',
  [JoinOutcome.Already]: 'You’re already in a ternary.',
};

/**
 * Starting a ternary or joining one by its code, with what friends will see said plainly
 * first. Your name in the ternary starts as your first name, and can be anything.
 */
export function StartTernary() {
  const { create, join } = useTernary();
  const { settings } = useSettings();
  const toast = useToast();
  const navigation = useTernaryNavigation();
  const [yourName, setYourName] = useState(settings.firstName);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const you = cleanTernaryName(yourName);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      console.warn('Ternary action failed', e);
      toast.show('Couldn’t reach Tern just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const start = () => run(() => create(cleanTernaryName(name), you));
  const joinIt = () =>
    run(async () => {
      setJoinError(JOIN_MESSAGES[await join(cleanInviteCode(code), you)]);
    });

  return (
    <View>
      <Text style={s.lead}>
        A few friends who fly one shared bird together. Each of you showing up
        carries it further, and nobody is ever ahead or behind.
      </Text>

      <Card>
        <Text style={typography.heading}>What your friends see</Text>
        <Text style={s.line}>• That you showed up today. A rest day counts.</Text>
        <Text style={s.line}>• That you’re resting, only if you turn that on.</Text>
        <Text style={s.line}>
          • Never what you ate, weighed or walked, your streak, or your own journey.
        </Text>
        <Text style={s.line}>• Never a day you didn’t open Tern. Quiet days show nothing.</Text>
      </Card>
      <Group>
        <Row
          title='What’s a ternary?'
          sub='The shared bird, fish, postcards and the table'
          chevron
          onPress={() => navigation.navigate('AboutTernary')}
        />
      </Group>

      <GroupLabel>Your name in the ternary</GroupLabel>
      <TernaryField
        label='Your name'
        value={yourName}
        onChangeText={setYourName}
        maxLength={TernaryRules.MAX_NAME_LENGTH}
      />

      <GroupLabel>Start one</GroupLabel>
      <TernaryField
        label='Ternary name'
        value={name}
        onChangeText={setName}
        maxLength={TernaryRules.MAX_NAME_LENGTH}
      />
      <TernaryButton
        label='Start the ternary'
        onPress={start}
        disabled={busy || !you || !cleanTernaryName(name)}
      />

      <GroupLabel>Or join with a code</GroupLabel>
      <TernaryField
        label='Invite code'
        value={code}
        onChangeText={(v) => {
          setCode(v);
          setJoinError(null);
        }}
        code
        maxLength={TernaryRules.INVITE_LENGTH + 2}
      />
      {joinError ? (
        <Text style={s.error} accessibilityLiveRegion='polite'>
          {joinError}
        </Text>
      ) : null}
      <TernaryButton
        label='Join'
        outline
        onPress={joinIt}
        disabled={
          busy || !you || cleanInviteCode(code).length !== TernaryRules.INVITE_LENGTH
        }
      />
      <FootNote>
        {`Everyone in a ternary has Tern Plus. Up to ${TernaryRules.MAX_MEMBERS} people, you included, and anyone can leave whenever they like.`}
      </FootNote>
    </View>
  );
}

const s = StyleSheet.create({
  lead: { ...typography.meta, lineHeight: 19, marginVertical: space.md },
  line: { ...typography.meta, lineHeight: 19, marginTop: space.xs },
  error: { ...typography.meta, color: colors.danger, marginBottom: space.xs },
});
