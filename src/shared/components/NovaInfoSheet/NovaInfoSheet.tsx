import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BottomSheet, Icon } from '@shared/components/ui';
import { colors, font, space, tierColors, typography } from '@shared/theme';
import { TierDot } from '../TierDot';
import { NovaLevels } from './models/novaLevels';

/**
 * The NOVA scale explained level by level, with familiar examples, as a sheet that slides up
 * from the bottom. Opened from the intake bars and from the food-type picker; `footnote` says
 * what the scale means on the screen that opened it.
 */
export function NovaInfoSheet({
  visible,
  onClose,
  footnote,
}: {
  visible: boolean;
  onClose: () => void;
  footnote: string;
}) {
  const { height } = useWindowDimensions();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.top}>
        <Text style={s.title}>About processing levels</Text>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole='button'
          accessibilityLabel='Close'
        >
          <Icon name='close' size={22} color={colors.ink3} />
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: height * 0.7 }}>
        <Text style={s.lead}>
          NOVA is a food-science scale for how processed something is, from 1 to
          4. It describes the food, not whether you should eat it.
        </Text>
        {NovaLevels.ALL.map((l) => (
          <View key={l.tier} style={s.row}>
            <TierDot tier={l.tier} color={tierColors[l.tier]} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{`${l.tier} · ${l.name}`}</Text>
              <Text style={s.body}>{l.body}</Text>
              <Text style={s.body}>
                <Text style={s.examplesLabel}>For example: </Text>
                {l.examples}
              </Text>
              <Text style={s.choice}>{`Logged as ${l.choice}`}</Text>
            </View>
          </View>
        ))}
        <Text style={s.foot}>{footnote}</Text>
      </ScrollView>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  title: typography.heading,
  lead: { ...typography.meta, lineHeight: 18, marginBottom: space.sm },
  row: { flexDirection: 'row', gap: 10, marginTop: space.md },
  name: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  body: { ...typography.caption, lineHeight: 17, marginTop: 2 },
  examplesLabel: { fontFamily: font.semibold },
  choice: { ...typography.tick, marginTop: 3 },
  foot: { ...typography.tick, lineHeight: 16, marginTop: space.lg },
});
