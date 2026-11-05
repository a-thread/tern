import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BottomSheet } from '@shared/components/ui';
import { colors, font, space, tierColors, typography } from '@shared/theme';
import { TierGroups } from '@/domain/food/models/tierGroups';
import { TierDot } from '../TierDot';
import { FoodTypeInfos } from './models/foodTypeInfo';

/**
 * The three food types (Whole, Processed, Ultra-processed) explained with familiar examples, as
 * a sheet that slides up from the bottom. Opened from the intake bars and from the food-type picker; `footnote` says
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
          <Text style={s.close}>×</Text>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: height * 0.7 }}>
        <Text style={s.lead}>
          NOVA is a food-science scale for how processed something is. Tern
          groups it into three food types. They describe the food, not whether
          you should eat it.
        </Text>
        {TierGroups.ALL.map((g) => {
          const info = FoodTypeInfos.BY_KEY[g.key];
          return (
            <View key={g.key} style={s.row}>
              <TierDot
                tier={g.tiers[0]}
                color={tierColors[g.tiers[0]]}
                showNumber={false}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={s.name}
                >{`${g.label} · NOVA ${g.tiers.join('–')}`}</Text>
                <Text style={s.body}>{info.body}</Text>
                <Text style={s.body}>
                  <Text style={s.examplesLabel}>For example: </Text>
                  {info.examples}
                </Text>
              </View>
            </View>
          );
        })}
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
  close: { fontFamily: font.body, fontSize: 24, color: colors.ink3 },
  lead: { ...typography.meta, lineHeight: 18, marginBottom: space.sm },
  row: { flexDirection: 'row', gap: 10, marginTop: space.md },
  name: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  body: { ...typography.caption, lineHeight: 17, marginTop: 2 },
  examplesLabel: { fontFamily: font.semibold },
  foot: { ...typography.tick, lineHeight: 16, marginTop: space.lg },
});
