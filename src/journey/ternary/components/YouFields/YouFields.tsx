import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, typography } from '@shared/theme';
import { FadeIn } from '@shared/components/FadeIn/FadeIn';
import { TernaryRules } from '@/domain/ternary/models/ternary';
import { FlockLooks } from '@/journey/models/flockLooks';
import { TernaryField } from '../TernaryField/TernaryField';
import { LookChoice } from '../LookChoice/LookChoice';

/** Your name in the ternary and the bird you fly as, the same on Start and Join. */
export function YouFields({
  name,
  onName,
  look,
  onLook,
}: {
  name: string;
  onName: (name: string) => void;
  look: number;
  onLook: (look: number) => void;
}) {
  return (
    <View>
      <TernaryField
        label='Your name'
        value={name}
        onChangeText={onName}
        maxLength={TernaryRules.MAX_NAME_LENGTH}
      />
      <View style={s.label}>
        <Text style={typography.label}>Your bird · </Text>
        <FadeIn key={look}>
          <Text style={typography.label}>{FlockLooks.NAMES[look]}</Text>
        </FadeIn>
      </View>
      <Text style={s.note}>
        How you fly on the map. If a friend already flies it, you’ll get the
        next free one; you can change it later.
      </Text>
      <LookChoice value={look} onChange={onLook} />
    </View>
  );
}

const s = StyleSheet.create({
  label: { flexDirection: 'row', marginBottom: space.xs },
  note: { ...typography.caption, lineHeight: 16, marginBottom: space.sm },
});
