import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@shared/components/ui';
import { colors, font, space, tierColors } from '@shared/theme';

const LEVELS = [
  { tiers: '1–2', color: tierColors[1], name: 'Whole', body: 'Fruit, vegetables, eggs, plain meat and dairy, and basic ingredients like oil, flour and butter.' },
  { tiers: '3', color: tierColors[3], name: 'Processed', body: 'Foods made by combining those, like bread, cheese, canned beans and tinned fish.' },
  { tiers: '4', color: tierColors[4], name: 'Ultra-processed', body: 'Industrial products with additives, like packaged snacks, soft drinks and instant meals.' },
] as const;

/** A short explainer on the NOVA scale, as a sheet that slides up from the bottom. */
export function NovaInfoSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View>
        <View style={s.top}>
          <Text style={s.title}>About processing levels</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel='Close'>
            <Text style={s.close}>×</Text>
          </Pressable>
        </View>
        <Text style={s.lead}>
          NOVA is a food-science scale for how processed something is, from 1 to
          4. It describes the food, not whether you should eat it.
        </Text>
        {LEVELS.map((l) => (
          <View key={l.name} style={s.row}>
            <View style={[s.dot, { backgroundColor: l.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{`${l.name} · NOVA ${l.tiers}`}</Text>
              <Text style={s.body}>{l.body}</Text>
            </View>
          </View>
        ))}
        <Text style={s.foot}>
          The bars show each group's share of today's calories. There is no
          target. Levels come from Open Food Facts, and you can change one on
          any food.
        </Text>
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.lg,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  title: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  close: { fontFamily: font.body, fontSize: 24, color: colors.ink3 },
  lead: {
    fontFamily: font.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.ink2,
    marginBottom: space.sm,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: space.md },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  name: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  body: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.ink2,
    marginTop: 2,
  },
  foot: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.ink3,
    marginTop: space.lg,
  },
});
