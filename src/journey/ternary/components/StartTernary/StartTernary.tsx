import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space, typography } from '@shared/theme';
import {
  Card,
  FootNote,
  Group,
  GroupLabel,
  Row,
  SegmentedControl,
} from '@shared/components/ui';
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
import { FlockLooks } from '@/journey/models/flockLooks';
import { TernaryField } from '../TernaryField/TernaryField';
import { RouteChoice } from './components/RouteChoice/RouteChoice';
import { Bullet } from './components/Bullet/Bullet';
import { LookChoice } from '../LookChoice/LookChoice';
import { TernaryButton } from '../TernaryButton/TernaryButton';

/** Starting a ternary of your own, or joining a friend's with their code. */
enum Way {
  Join = 'join',
  Start = 'start',
}

const WAY_LABELS: Record<Way, string> = {
  [Way.Join]: 'Join with a code',
  [Way.Start]: 'Start a ternary',
};

const JOIN_MESSAGES: Record<JoinOutcome, string | null> = {
  [JoinOutcome.Joined]: null,
  [JoinOutcome.NotFound]:
    'No ternary has that code. Check it with whoever sent it.',
  [JoinOutcome.Full]: 'That ternary is full.',
  [JoinOutcome.Already]: 'You’re already in a ternary.',
};

/**
 * Starting a ternary or joining one by its code, with what friends will see said plainly
 * first. Your name and bird come next, for either; then only the form for the way you pick,
 * joining first, since most people arrive with a friend's code. Your name in the ternary
 * starts as your first name, and can be anything.
 */
export function StartTernary() {
  const { create, join } = useTernary();
  const { settings } = useSettings();
  const toast = useToast();
  const navigation = useTernaryNavigation();
  const [yourName, setYourName] = useState(settings.firstName);
  // A bird picked at random to start with, so friends who don't choose rarely clash.
  const [look, setLook] = useState(() =>
    Math.floor(Math.random() * TernaryRules.LOOKS),
  );
  const [way, setWay] = useState(Way.Join);
  const [name, setName] = useState('');
  const [route, setRoute] = useState(RouteId.Greenland);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  // Said next to what needs fixing, never only as a faded button.
  const [error, setError] = useState<string | null>(null);

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

  const start = () => {
    const ternaryName = cleanTernaryName(name);
    if (!you) return setError('Add your name above.');
    if (!ternaryName) return setError('Give your ternary a name.');
    setError(null);
    run(() => create(ternaryName, you, route, look));
  };
  const joinIt = () => {
    const cleaned = cleanInviteCode(code);
    if (!you) return setError('Add your name above.');
    if (cleaned.length !== TernaryRules.INVITE_LENGTH) {
      return setError(
        `Invite codes are ${TernaryRules.INVITE_LENGTH} letters and numbers.`,
      );
    }
    setError(null);
    run(async () => {
      setError(JOIN_MESSAGES[await join(cleaned, you, look)]);
    });
  };
  const clearing =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setError(null);
    };

  const errorText = error ? (
    <Text style={s.error} accessibilityLiveRegion='polite'>
      {error}
    </Text>
  ) : null;

  return (
    <View>
      <Text style={s.lead}>
        A few friends who fly one shared bird together. Each of you showing up
        carries it further, and nobody is ever ahead or behind.
      </Text>

      <GroupLabel>What friends see</GroupLabel>
      <Card>
        <Bullet first>That you showed up today. A rest day counts.</Bullet>
        <Bullet>That you’re resting, only if you turn that on.</Bullet>
        <Bullet>What you send: fish, postcards and recipes you share.</Bullet>
        <Bullet>
          Never what you ate, weighed or walked, your streak, or how far your
          own tern has flown.
        </Bullet>
        <Bullet>
          Never a day you didn’t open Tern. Quiet days show nothing.
        </Bullet>
      </Card>
      <Group style={s.about}>
        <Row
          title='What’s a ternary?'
          sub='The shared bird, fish, postcards and the recipe swap'
          chevron
          onPress={() => navigation.navigate('AboutTernary')}
        />
      </Group>
      <FootNote>
        Everyone in a ternary has Tern Plus, and anyone can leave whenever they
        like.
      </FootNote>

      <GroupLabel>You</GroupLabel>
      <TernaryField
        label='Your name'
        value={yourName}
        onChangeText={clearing(setYourName)}
        maxLength={TernaryRules.MAX_NAME_LENGTH}
      />
      <Text style={s.label}>{`Your bird · ${FlockLooks.NAMES[look]}`}</Text>
      <Text style={s.note}>
        How you fly on the map. If a friend already flies it, you’ll get the
        next free one; you can change it later.
      </Text>
      <LookChoice value={look} onChange={setLook} />

      <SegmentedControl
        options={[Way.Join, Way.Start]}
        value={way}
        onChange={clearing(setWay)}
        label={(w) => WAY_LABELS[w]}
        style={s.ways}
      />

      {way === Way.Join ? (
        <>
          <TernaryField
            label='Invite code'
            value={code}
            onChangeText={clearing(setCode)}
            code
            maxLength={TernaryRules.INVITE_LENGTH + 2}
          />
          {errorText}
          <TernaryButton label='Join' onPress={joinIt} disabled={busy} />
          <FootNote>Ask whoever started the ternary for its code.</FootNote>
        </>
      ) : (
        <>
          <TernaryField
            label='Ternary name'
            value={name}
            onChangeText={clearing(setName)}
            maxLength={TernaryRules.MAX_NAME_LENGTH}
          />
          <Text style={s.label}>Migration</Text>
          <RouteChoice value={route} onChange={setRoute} />
          {errorText}
          <TernaryButton
            label='Start the ternary'
            onPress={start}
            disabled={busy}
          />
          <FootNote>
            {`Up to ${TernaryRules.MAX_MEMBERS} people, you included. You’ll get a code to share.`}
          </FootNote>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  lead: { ...typography.meta, lineHeight: 19, marginVertical: space.md },
  about: { marginTop: space.sm },
  error: { ...typography.meta, color: colors.danger, marginBottom: space.sm },
  // Like a field's label (`TernaryField`), for the choices that aren't a text field.
  label: { ...typography.label, marginBottom: space.xs },
  note: { ...typography.caption, lineHeight: 16, marginBottom: space.sm },
  ways: { marginTop: space.lg, marginBottom: space.md },
});
