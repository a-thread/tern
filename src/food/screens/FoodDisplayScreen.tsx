import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, space, tierColors } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
  FootNote,
  Row,
  Stepper,
} from '@shared/components/ui';
import { nudgeZone, resolveZone } from '@food/models/intakeZone';
import { TierDot } from '@food/components/TierDot';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import { useSettings } from '@settings/SettingsContext';

const PREVIEW_ITEMS = [
  { tier: 1 as const, name: 'Greek yogurt with berries', calories: 210 },
  { tier: 3 as const, name: 'Turkey sandwich', calories: 460 },
  { tier: 4 as const, name: 'Graham crackers', calories: 130 },
];

export default function FoodDisplayScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { showTiers, showCalories } = useFoodDisplay();
  const zone = resolveZone(settings.calorieZone, settings.calorieTarget);

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
          {showTiers ? (
            <ToggleRow
              title='Show number as well as color'
              sub='Recommended — readable without color vision'
              on={settings.showTierNumber}
              onToggle={(v) => updateSettings({ showTierNumber: v })}
            />
          ) : null}
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
              {showTiers ? (
                <TierDot
                  tier={item.tier}
                  color={tierColors[item.tier]}
                  showNumber={settings.showTierNumber}
                />
              ) : null}
              <Text style={s.previewName}>{item.name}</Text>
              {showCalories ? (
                <Text style={s.previewCals}>{item.calories}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <GroupLabel>Calories</GroupLabel>
        {settings.trackCalories ? (
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
        ) : (
          <FootNote>
            Calorie tracking is off, so no calorie numbers are shown. Turn it on under Settings → Calorie & macro targets.
          </FootNote>
        )}
        {settings.trackCalories ? (
          <>
            <GroupLabel>Intake bars</GroupLabel>
            <Group>
              <ToggleRow
                title='Show intake bars'
                sub='Calories and macros at the top of the Food page'
                on={settings.showIntakeBars}
                onToggle={(v) => updateSettings({ showIntakeBars: v })}
              />
              {settings.showIntakeBars ? (
                <Row
                  title='Calorie zone, low'
                  right={
                    <Stepper
                      value={zone.min.toLocaleString()}
                      valueMinWidth={56}
                      decrementLabel='Lower the zone minimum'
                      incrementLabel='Raise the zone minimum'
                      onDecrement={() =>
                        updateSettings({ calorieZone: nudgeZone(zone, 'min', -1) })
                      }
                      onIncrement={() =>
                        updateSettings({ calorieZone: nudgeZone(zone, 'min', 1) })
                      }
                    />
                  }
                />
              ) : null}
              {settings.showIntakeBars ? (
                <Row
                  title='Calorie zone, high'
                  right={
                    <Stepper
                      value={zone.max.toLocaleString()}
                      valueMinWidth={56}
                      decrementLabel='Lower the zone maximum'
                      incrementLabel='Raise the zone maximum'
                      onDecrement={() =>
                        updateSettings({ calorieZone: nudgeZone(zone, 'max', -1) })
                      }
                      onIncrement={() =>
                        updateSettings({ calorieZone: nudgeZone(zone, 'max', 1) })
                      }
                    />
                  }
                />
              ) : null}
              {settings.showIntakeBars ? (
                <ToggleRow
                  title='Protein as a minimum'
                  sub='Something to reach, not a limit'
                  on={settings.proteinAsMinimum}
                  onToggle={(v) => updateSettings({ proteinAsMinimum: v })}
                />
              ) : null}
            </Group>
            <FootNote>
              The zone starts around your calorie target. Bars never turn red
              or warn you, in or out of the zone.
            </FootNote>
          </>
        ) : null}
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
