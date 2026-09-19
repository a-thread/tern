import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space, tierColors } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
  FootNote,
} from '@shared/components/ui';
import { TierDot } from '@food/components';
import { useSettings } from './SettingsContext';
import type { SettingsStackParamList } from './types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'FoodDisplay'>;

const PREVIEW_ITEMS = [
  { tier: 1 as const, name: 'Greek yogurt with berries', calories: 210 },
  { tier: 3 as const, name: 'Turkey sandwich', calories: 460 },
  { tier: 4 as const, name: 'French fries, side', calories: 380 },
];

export default function FoodDisplayScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Food display'
        backLabel='Settings'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <GroupLabel>Processing labels</GroupLabel>
        <Group>
          <ToggleRow
            title='Show processing level'
            sub='Color and NOVA number on each food'
            on={settings.showTiers}
            onToggle={(v) => updateSettings({ showTiers: v })}
          />
          <ToggleRow
            title='Show number as well as color'
            sub='Recommended — readable without color vision'
            on={settings.showTierNumber}
            onToggle={(v) => updateSettings({ showTierNumber: v })}
          />
        </Group>
        <FootNote>
          NOVA is a food-science scale for how processed something is — not a
          measure of how "good" it is. Turn it off entirely if it isn't useful
          to you.
        </FootNote>

        <Text style={s.previewLabel}>Preview</Text>
        <View style={s.previewCard}>
          {PREVIEW_ITEMS.map((item) => (
            <View key={item.name} style={s.previewRow}>
              {settings.showTiers ? (
                <TierDot
                  tier={item.tier}
                  color={tierColors[item.tier]}
                  showNumber={settings.showTierNumber}
                />
              ) : null}
              <Text style={s.previewName}>{item.name}</Text>
              {settings.showCalories ? (
                <Text style={s.previewCals}>{item.calories}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <GroupLabel>Calories</GroupLabel>
        <Group>
          <ToggleRow
            title='Show calorie counts'
            sub="Hide if you'd rather track meals without numbers"
            on={settings.showCalories}
            onToggle={(v) => updateSettings({ showCalories: v })}
          />
          <ToggleRow
            title='Show remaining vs. target'
            sub='Off shows totals only, with no "left today" figure'
            on={settings.showRemainingVsTarget}
            onToggle={(v) => updateSettings({ showRemainingVsTarget: v })}
          />
        </Group>
        <FootNote>
          Tern never shows exercise as "earning back" calories, and won't warn
          you for going over a target.
        </FootNote>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  previewLabel: {
    fontFamily: font.body,
    fontSize: 10.5,
    color: colors.ink3,
    marginTop: space.md,
    marginLeft: space.xs + 2,
  },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
    marginTop: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  previewName: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink,
  },
  previewCals: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
});
