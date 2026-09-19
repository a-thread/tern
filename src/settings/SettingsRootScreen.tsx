import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, space } from '@shared/theme';
import {
  Group,
  GroupLabel,
  IconBadge,
  Chip,
  Chevron,
  ToggleRow,
  FootNote,
  PushHeader,
} from '@shared/components/ui';
import { profile } from './mock';
import { useSettings } from './SettingsContext';
import type { SettingsStackParamList } from './types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsRoot'>;

export default function SettingsRootScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  const stepWeightGoal = (delta: number) =>
    updateSettings({
      weightGoalKg: Math.round((settings.weightGoalKg + delta) * 2) / 2,
    });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Settings'
        backLabel='Back'
        onBack={() => navigation.getParent()?.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 60,
        }}
      >
        <Group style={{ marginTop: 4 }}>
          <View style={s.row}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{profile.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{profile.name}</Text>
              <Text style={s.rowSub}>Local profile</Text>
            </View>
          </View>
        </Group>

        <GroupLabel>Goals</GroupLabel>
        <Group>
          <SettingsRow
            icon={
              <IconBadge bg={colors.coralTint}>
                <Svg
                  width={15}
                  height={15}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke={colors.coral}
                  strokeWidth={2}
                >
                  <Path d='M5 21V4M5 4h11l-2 3 2 3H5' />
                </Svg>
              </IconBadge>
            }
            title='Daily step goal'
            value={settings.stepGoal.toLocaleString()}
            onPress={() => navigation.navigate('StepGoal')}
          />
          <SettingsRow
            icon={
              <IconBadge bg={colors.waterTint}>
                <Svg
                  width={15}
                  height={15}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke={colors.water}
                  strokeWidth={2}
                >
                  <Path d='M4 19V9m6 10V4m6 15v-6' />
                </Svg>
              </IconBadge>
            }
            title='Calorie & macro targets'
            value={
              settings.trackCalories
                ? settings.calorieTarget.toLocaleString()
                : 'Off'
            }
            onPress={() => navigation.navigate('Targets')}
          />
          <View style={s.row}>
            <IconBadge bg='#EDF1E9'>
              <Svg
                width={15}
                height={15}
                viewBox='0 0 24 24'
                fill='none'
                stroke='#4C6B4F'
                strokeWidth={2}
              >
                <Path d='M6 5h12M9 5v2a3 3 0 1 0 6 0V5M7 19h10M9 19c0-4 1-6 3-7 2 1 3 3 3 7' />
              </Svg>
            </IconBadge>
            <Text style={[s.rowTitle, { flex: 1 }]}>Weight goal</Text>
            <View style={s.stepper}>
              <Pressable onPress={() => stepWeightGoal(-0.5)} hitSlop={8}>
                <Text style={s.stepperBtn}>−</Text>
              </Pressable>
              <Text style={s.stepperVal}>{settings.weightGoalKg} kg</Text>
              <Pressable onPress={() => stepWeightGoal(0.5)} hitSlop={8}>
                <Text style={s.stepperBtn}>+</Text>
              </Pressable>
            </View>
          </View>
          <SettingsRow
            icon={
              <IconBadge bg={colors.driftwoodTint}>
                <Svg
                  width={15}
                  height={15}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke={colors.driftwood}
                  strokeWidth={2}
                >
                  <Path d='M4 18h16M6 18v-3a6 6 0 0 1 12 0v3' />
                </Svg>
              </IconBadge>
            }
            title='Rest days'
            sub={`${settings.restDaysPerWeek} per week, streak protected`}
            onPress={() => navigation.navigate('RestDays')}
          />
        </Group>

        <GroupLabel>Data & display</GroupLabel>
        <Group>
          <SettingsRow
            icon={
              <IconBadge bg={colors.doveTint}>
                <Svg
                  width={15}
                  height={15}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke={colors.ink2}
                  strokeWidth={2}
                >
                  <Path d='M12 3c-4 3-6 6-6 9a6 6 0 0 0 12 0c0-3-2-6-6-9z' />
                </Svg>
              </IconBadge>
            }
            title='Food display'
            onPress={() => navigation.navigate('FoodDisplay')}
          />
          <SettingsRow
            icon={
              <IconBadge bg='#E4EFE6'>
                <Svg
                  width={15}
                  height={15}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='#3B6B4A'
                  strokeWidth={2}
                >
                  <Path d='M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z' />
                </Svg>
              </IconBadge>
            }
            title='Health data'
            sub='Steps sync automatically'
            badge={settings.healthData.connected ? 'Connected' : undefined}
            onPress={() => navigation.navigate('HealthData')}
          />
        </Group>

        <GroupLabel>Reminders</GroupLabel>
        <Group>
          <ToggleRow
            title='Log meals'
            sub={settings.reminders.mealLog.time}
            on={settings.reminders.mealLog.on}
            onToggle={(v) =>
              updateSettings({
                reminders: {
                  ...settings.reminders,
                  mealLog: { ...settings.reminders.mealLog, on: v },
                },
              })
            }
          />
          <ToggleRow
            title='Weekly weigh-in'
            sub={settings.reminders.weeklyWeighIn.time}
            on={settings.reminders.weeklyWeighIn.on}
            onToggle={(v) =>
              updateSettings({
                reminders: {
                  ...settings.reminders,
                  weeklyWeighIn: { ...settings.reminders.weeklyWeighIn, on: v },
                },
              })
            }
          />
          <ToggleRow
            title='Step goal nudge'
            sub="Only if you're close, late in the day"
            on={settings.reminders.stepGoalNudge.on}
            onToggle={(v) =>
              updateSettings({
                reminders: { ...settings.reminders, stepGoalNudge: { on: v } },
              })
            }
          />
        </Group>

        <GroupLabel>About</GroupLabel>
        <Group>
          <View style={s.row}>
            <Text style={[s.rowTitle, { flex: 1 }]}>Version</Text>
            <Text style={s.rowValue}>1.0.0</Text>
          </View>
        </Group>

        <FootNote>
          Nutrition data from Open Food Facts, used under the Open Database
          License.
        </FootNote>
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  sub,
  value,
  badge,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  value?: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={s.row}
      android_ripple={{ color: colors.doveTint }}
      onPress={onPress}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      {badge ? (
        <Chip bg='#E4EFE6' color='#3B6B4A'>
          {badge}
        </Chip>
      ) : null}
      <Chevron />
    </Pressable>
  );
}

const s = StyleSheet.create({
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
    lineHeight: 16,
  },
  rowValue: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    marginRight: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.water,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.semibold, fontSize: 15, color: '#EAF2F4' },
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
    fontSize: 13,
    color: colors.ink,
    minWidth: 52,
    textAlign: 'center',
  },
});
