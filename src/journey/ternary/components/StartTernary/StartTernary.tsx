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
import { RouteId } from '@/domain/waypoints/models/routes';
import { TernaryField } from '../TernaryField/TernaryField';
import { RouteChoice } from './components/RouteChoice/RouteChoice';
import { LookChoice } from '../LookChoice/LookChoice';
import { TernaryButton } from '../TernaryButton/TernaryButton';

const JOIN_MESSAGES: Record<JoinOutcome, string | null> = {
  [JoinOutcome.Joined]: null,
  [JoinOutcome.NotFound]:
    'No ternary has that code. Check it with whoever sent it.',
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
  const [route, setRoute] = useState(RouteId.Greenland);
  // A bird picked at random to start with, so friends who don't choose rarely clash.
  const [look, setLook] = useState(() =>
    Math.floor(Math.random() * TernaryRules.LOOKS),
  );
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

  const start = () =>
    run(() => create(cleanTernaryName(name), you, route, look));
  const joinIt = () =>
    run(async () => {
      setJoinError(JOIN_MESSAGES[await join(cleanInviteCode(code), you, look)]);
    });

  return (
    <View>
      <Text style={s.lead}>
        A few friends who fly one shared bird together. Each of you showing up
        carries it further, and nobody is ever ahead or behind.
      </Text>

      <GroupLabel>What friends see</GroupLabel>
      <Card>
        <Text style={s.first}>
          • That you showed up today. A rest day counts.
        </Text>
        <Text style={s.line}>
          • That you’re resting, only if you turn that on.
        </Text>
        <Text style={s.line}>
          • What you send: fish, postcards and recipes you share.
        </Text>
        <Text style={s.line}>
          • Never what you ate, weighed or walked, your streak, or how far your
          own tern has flown.
        </Text>
        <Text style={s.line}>
          • Never a day you didn’t open Tern. Quiet days show nothing.
        </Text>
      </Card>
      <Group>
        <Row
          title='What’s a ternary?'
          sub='The shared bird, fish, postcards and the recipe swap'
          chevron
          onPress={() => navigation.navigate('AboutTernary')}
        />
      </Group>

      <GroupLabel>You</GroupLabel>
      <TernaryField
        label='Your name'
        value={yourName}
        onChangeText={setYourName}
        maxLength={TernaryRules.MAX_NAME_LENGTH}
      />
      <Text style={s.label}>Your bird</Text>
      <Text style={s.note}>
        How you fly on the map. If a friend already flies it, you’ll get the
        next free one; you can change it later.
      </Text>
      <LookChoice value={look} onChange={setLook} />

      <GroupLabel>Start a ternary</GroupLabel>
      <TernaryField
        label='Ternary name'
        value={name}
        onChangeText={setName}
        maxLength={TernaryRules.MAX_NAME_LENGTH}
      />
      <Text style={s.label}>Migration</Text>
      <RouteChoice value={route} onChange={setRoute} />
      <TernaryButton
        label='Start the ternary'
        onPress={start}
        disabled={busy || !you || !cleanTernaryName(name)}
      />

      <GroupLabel>Or join one</GroupLabel>
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
          busy ||
          !you ||
          cleanInviteCode(code).length !== TernaryRules.INVITE_LENGTH
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
  first: { ...typography.meta, lineHeight: 19 },
  line: { ...typography.meta, lineHeight: 19, marginTop: space.xs },
  error: { ...typography.meta, color: colors.danger, marginBottom: space.xs },
  // Like a field's label (`TernaryField`), for the choices that aren't a text field.
  label: { ...typography.label, marginBottom: space.xs },
  note: { ...typography.caption, lineHeight: 16, marginBottom: space.sm },
});
