import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, space, typography } from '@shared/theme';
import { FootNote } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useTernaryNavigation } from '@/navigation/useAppNavigation';
import { useTernary } from '@/domain/ternary/TernaryContext';
import {
  cleanTernaryName,
  TernaryRules,
} from '@/domain/ternary/models/ternary';
import { RouteId } from '@/domain/waypoints/models/routes';
import { TernaryPage } from '../components/TernaryPage/TernaryPage';
import { TernaryField } from '../components/TernaryField/TernaryField';
import { TernaryButton } from '../components/TernaryButton/TernaryButton';
import { YouFields } from '../components/YouFields/YouFields';
import { useYou } from '../hooks/useYou';
import { RouteChoice } from './components/RouteChoice/RouteChoice';

/** Starting a ternary: its name first, then you, then which migration it flies. */
export default function StartTernaryScreen() {
  const { create } = useTernary();
  const toast = useToast();
  const navigation = useTernaryNavigation();
  const you = useYou();
  const [name, setName] = useState('');
  const [route, setRoute] = useState(RouteId.Greenland);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    const ternaryName = cleanTernaryName(name);
    const yourName = cleanTernaryName(you.name);
    if (!ternaryName) return setError('Give your ternary a name.');
    if (!yourName) return setError('Add your name.');
    setError(null);
    setBusy(true);
    try {
      await create(ternaryName, yourName, route, you.look);
      navigation.popTo('TernaryHome', { arrived: true });
    } catch (e) {
      console.warn('Could not start a ternary', e);
      toast.show('Couldn’t reach Tern just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <TernaryPage title='Start a ternary'>
      <TernaryField
        label='Ternary name'
        value={name}
        onChangeText={(v) => {
          setName(v);
          setError(null);
        }}
        maxLength={TernaryRules.MAX_NAME_LENGTH}
      />
      <YouFields
        name={you.name}
        onName={(v) => {
          you.setName(v);
          setError(null);
        }}
        look={you.look}
        onLook={you.setLook}
      />
      <Text style={s.label}>Migration</Text>
      <RouteChoice value={route} onChange={setRoute} />
      {error ? (
        <Text style={s.error} accessibilityLiveRegion='polite'>
          {error}
        </Text>
      ) : null}
      <TernaryButton
        label='Start the ternary'
        onPress={start}
        disabled={busy}
      />
      <FootNote>
        {`Up to ${TernaryRules.MAX_MEMBERS} people, you included. You’ll get a code to share.`}
      </FootNote>
    </TernaryPage>
  );
}

const s = StyleSheet.create({
  label: { ...typography.label, marginBottom: space.xs },
  error: { ...typography.meta, color: colors.danger, marginBottom: space.sm },
});
