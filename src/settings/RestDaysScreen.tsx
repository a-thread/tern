import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
  IconBadge,
} from '@shared/components/ui';
import { useSettings } from './SettingsContext';
import type { SettingsStackParamList } from './types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'RestDays'>;

export default function RestDaysScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

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
        backLabel='Settings'
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
            <View style={s.stepper}>
              <Pressable onPress={() => stepAllowance(-1)} hitSlop={8}>
                <Text style={s.stepperBtn}>−</Text>
              </Pressable>
              <Text style={s.stepperVal}>{settings.restDaysPerWeek}</Text>
              <Pressable onPress={() => stepAllowance(1)} hitSlop={8}>
                <Text style={s.stepperBtn}>+</Text>
              </Pressable>
            </View>
          </View>
          <ToggleRow
            title='Auto-detect'
            sub='Mark a low-step day as rest instead of missed'
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
            sub='Resting counts as showing up'
          />
          <View style={s.row}>
            <IconBadge bg={colors.driftwoodTint}>
              <Svg
                width={14}
                height={14}
                viewBox='0 0 24 24'
                fill='none'
                stroke={colors.driftwood}
                strokeWidth={2.5}
              >
                <Path d='M5 12h14' />
              </Svg>
            </IconBadge>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Shows in driftwood</Text>
              <Text style={s.rowSub}>
                Distinct from a missed day on your charts
              </Text>
            </View>
          </View>
        </Group>

        <GroupLabel>Missed days</GroupLabel>
        <View style={s.card}>
          <Text style={s.intro}>
            Running out of rest days won't erase your waypoints or your history
            — a streak just starts counting again. Nothing you've already earned
            is ever taken back.
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
        <Svg
          width={14}
          height={14}
          viewBox='0 0 24 24'
          fill='none'
          stroke='#3B6B4A'
          strokeWidth={2.5}
        >
          <Path d='M20 6 9 17l-5-5' />
        </Svg>
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E5DD',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepperBtn: {
    fontFamily: font.body,
    fontSize: 17,
    color: colors.coral,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepperVal: {
    fontFamily: font.semibold,
    fontSize: 13.5,
    color: colors.ink,
    minWidth: 26,
    textAlign: 'center',
  },
});
