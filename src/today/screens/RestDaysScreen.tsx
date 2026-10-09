import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, PushHeader, ToggleRow, IconBadge, Stepper, Icon } from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { useActivity } from '@today/ActivityContext';
import { StreakFreezes } from '@today/models/dayRecord';

export default function RestDaysScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { freezes } = useActivity();

  const stepAllowance = (delta: number) =>
    updateSettings({
      restDaysPerWeek: Math.min(
        Math.max(settings.restDaysPerWeek + delta, 0),
        7,
      ),
    });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Rest days'
        backLabel='Back'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <View style={s.card}>
          <Text style={s.intro}>
            Arctic terns stop for weeks at a time mid-migration to rest and
            refuel. Rest days work the same way here: they're part of the route,
            not a break from it.
          </Text>
        </View>

        <GroupLabel>Allowance</GroupLabel>
        <Group>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Rest days per week</Text>
              <Text style={s.rowSub}>Unused ones don't carry over</Text>
            </View>
            <Stepper value={settings.restDaysPerWeek} onDecrement={() => stepAllowance(-1)} onIncrement={() => stepAllowance(1)} valueMinWidth={26} />
          </View>
          <ToggleRow
            title='Auto-detect'
            sub='Count a past day under your goal as rest, within your allowance'
            on={settings.autoDetectRestDays}
            onToggle={(v) => updateSettings({ autoDetectRestDays: v })}
          />
        </Group>

        <GroupLabel>What a rest day does</GroupLabel>
        <Group>
          <InfoRow
            text='Keeps your streak'
            sub="The count holds; it doesn't increase"
          />
          <InfoRow
            text='Earns 10 waypoints'
            sub="Resting counts as showing up. If you reach your step goal anyway, it's a goal day instead"
          />
          <View style={s.row}>
            <IconBadge bg={colors.driftwoodTint}>
              <Icon name='minus' size={16} color={colors.driftwood} />
            </IconBadge>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Shows in driftwood</Text>
              <Text style={s.rowSub}>
                Distinct from a missed day on your charts
              </Text>
            </View>
          </View>
        </Group>

        <GroupLabel>Streak freezes</GroupLabel>
        <Group>
          <InfoRow
            text={freezes === 0 ? 'No freezes right now' : `${freezes} ${freezes === 1 ? 'freeze' : 'freezes'} ready`}
            sub='Held for the next day that would break your streak'
          />
          <InfoRow
            text={`Earn one every ${StreakFreezes.EVERY} days`}
            sub={`Each time your streak reaches a multiple of ${StreakFreezes.EVERY} days. You can hold up to ${StreakFreezes.MAX}`}
          />
          <InfoRow
            text='Used for you'
            sub='When a day would break your streak and your rest days are used, a freeze covers it. It shows in blue and holds the streak without adding a day'
          />
        </Group>

        <GroupLabel>Missed days</GroupLabel>
        <View style={s.card}>
          <Text style={s.intro}>
            Running out of rest days won't erase your waypoints or your history
            — a streak just starts counting again, unless a freeze covers the day. Once a day is over, what it
            earned is yours for good. (Today's waypoints follow today: remove a
            meal or a drink and that award steps back until it's there again.)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ text, sub }: { text: string; sub: string }) {
  return (
    <View style={s.row}>
      <IconBadge bg='#E4EFE6'>
        <Icon name='check' size={16} color='#3B6B4A' />
      </IconBadge>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{text}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
    marginTop: 6,
  },
  intro: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: colors.ink2,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 2,
  },
});
