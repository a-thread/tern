import React, { useEffect, useState } from 'react';
import {
  Alert,
  Share,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
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
import { useAuth } from '@shared/auth/AuthContext';
import { useBackend } from '@shared/state/BackendContext';
import { useToast } from '@shared/state/ToastContext';
import { useActivity } from '@today/ActivityContext';
import { MAX_NAME } from '@shared/auth/validation';
import { useSettings } from './SettingsContext';
import { useUnits } from './useUnits';
import TimeStepperRow from './TimeStepperRow';
import { clampWaterGoal } from '@water/models';
import {
  REMINDER_STEP_MINUTES,
  WATER_EVERY_HOURS,
  describeReminders,
  formatMinutes,
  stepMinutes,
  stepWeekday,
  weekdayPlural,
} from './reminders.plan';
import type { SettingsStackParamList } from './types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsRoot'>;

export default function SettingsRootScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const auth = useAuth();
  const { status: stepsStatus } = useActivity();
  const { data: dataRepo } = useBackend();
  const reminders = settings.reminders;
  const reminderText = describeReminders(reminders, settings.weighInFrequency);
  const medicationCount = settings.medications.length;
  const stepStep = REMINDER_STEP_MINUTES;
  const toast = useToast();
  const [dataBusy, setDataBusy] = useState(false);

  const exportData = async () => {
    if (!dataRepo || dataBusy) return;
    setDataBusy(true);
    try {
      const copy = await dataRepo.exportAll();
      await Share.share({ title: 'Tern data', message: JSON.stringify(copy, null, 2) });
    } catch (e) {
      console.warn('Could not export data', e);
      toast.show("Couldn't export your data — please try again.");
    } finally {
      setDataBusy(false);
    }
  };

  const deleteData = () => {
    if (!dataRepo || dataBusy) return;
    Alert.alert(
      'Delete all your data?',
      "This erases your food log, saved meals, weigh-ins, water, medication and mood history, waypoints, rest days and settings from Tern. It can't be undone. You'll be signed out, and your login stays so you can start fresh.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDataBusy(true);
            try {
              await dataRepo.deleteAll();
              await auth?.signOut();
            } catch (e) {
              console.warn('Could not delete data', e);
              toast.show("Couldn't delete your data — please try again.");
              setDataBusy(false);
            }
          },
        },
      ],
    );
  };

  const deleteAccount = () => {
    if (!dataRepo || dataBusy) return;
    Alert.alert(
      'Delete your account?',
      "This permanently deletes your account and everything in it: your food log, saved meals, weigh-ins, water, medication and mood history, waypoints, rest days and settings. It can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setDataBusy(true);
            try {
              await dataRepo.deleteAccount();
            } catch (e) {
              console.warn('Could not delete account', e);
              toast.show("Couldn't delete your account — please try again.");
              setDataBusy(false);
              return;
            }
            // The login is gone, so ending the session is best effort.
            try {
              await auth?.signOut();
            } catch (e) {
              console.warn('Could not sign out after deleting the account', e);
            }
          },
        },
      ],
    );
  };
  const email = auth?.session?.user.email;

  // Edited locally and saved on blur, so each keystroke isn't a settings write.
  const [name, setName] = useState(settings.firstName);
  useEffect(() => setName(settings.firstName), [settings.firstName]);
  const saveName = () => {
    const trimmed = name.trim();
    setName(trimmed);
    if (trimmed !== settings.firstName) updateSettings({ firstName: trimmed });
  };

  const { units, toDisplay, fromDisplay, formatGoal, formatVolume, stepWaterGoal } = useUnits();

  // Whole pounds, or half kilograms, in whichever unit is showing.
  const stepWeightGoal = (dir: 1 | -1) => {
    const shown = toDisplay(settings.weightGoalLb);
    const next =
      units === 'imperial'
        ? Math.round(shown) + dir
        : Math.round(shown * 2) / 2 + dir * 0.5;
    updateSettings({ weightGoalLb: fromDisplay(next) });
  };

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
              <Text style={s.avatarText}>
                {(name.trim() || email || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                value={name}
                onChangeText={setName}
                onBlur={saveName}
                onSubmitEditing={saveName}
                placeholder='First name'
                placeholderTextColor={colors.ink3}
                maxLength={MAX_NAME}
                autoCapitalize='words'
                autoComplete='given-name'
                returnKeyType='done'
                accessibilityLabel='First name'
                style={s.nameInput}
              />
              <Text style={s.rowSub}>
                {auth?.isGuest
                  ? 'Preview · nothing is saved, this resets when you exit'
                  : (email ?? 'Local profile')}
              </Text>
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
              <Pressable onPress={() => stepWeightGoal(-1)} hitSlop={8}>
                <Text style={s.stepperBtn}>−</Text>
              </Pressable>
              <Text style={s.stepperVal}>{formatGoal(settings.weightGoalLb)}</Text>
              <Pressable onPress={() => stepWeightGoal(1)} hitSlop={8}>
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
          <View style={s.row}>
            <Text style={[s.rowTitle, { flex: 1 }]}>Units</Text>
            <View style={s.stepper}>
              {(['imperial', 'metric'] as const).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => updateSettings({ units: u })}
                  style={[s.unitItem, units === u && s.unitItemOn]}
                >
                  <Text style={[s.unitText, units === u && s.unitTextOn]}>
                    {u === 'imperial' ? 'lb' : 'kg'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
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
            badge={stepsStatus === 'connected' ? 'Connected' : undefined}
            onPress={() => navigation.navigate('HealthData')}
          />
        </Group>

        <GroupLabel>Medication</GroupLabel>
        <Group>
          <SettingsRow
            icon={
              <IconBadge bg={colors.violetTint}>
                <Svg
                  width={15}
                  height={15}
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke={colors.violet}
                  strokeWidth={2}
                >
                  <Path d='M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7zM8.5 8.5l7 7' />
                </Svg>
              </IconBadge>
            }
            title='Medication'
            sub={
              medicationCount
                ? 'Mark each one taken from Today'
                : 'Optional — track whether you took it'
            }
            value={medicationCount ? String(medicationCount) : undefined}
            onPress={() => navigation.navigate('Medication')}
          />
        </Group>

        <GroupLabel>Water</GroupLabel>
        <Group>
          <ToggleRow
            title='Track water'
            sub='Optional. Log drinks from the Food tab'
            on={settings.trackWater}
            onToggle={(v) => updateSettings({ trackWater: v })}
          />
          {settings.trackWater ? (
            <TimeStepperRow
              label='Daily goal'
              value={formatVolume(settings.waterGoalOz)}
              onStep={(d) =>
                updateSettings({ waterGoalOz: clampWaterGoal(stepWaterGoal(settings.waterGoalOz, d)) })
              }
            />
          ) : null}
        </Group>

        <GroupLabel>Mood &amp; stress</GroupLabel>
        <Group>
          <ToggleRow
            title='Track mood and stress'
            sub='Optional. A quick daily check-in from Today'
            on={settings.trackMood}
            onToggle={(v) => updateSettings({ trackMood: v })}
          />
        </Group>

        <GroupLabel>Reminders</GroupLabel>
        <Group>
          <ToggleRow
            title='Log meals'
            sub={reminderText.meals}
            on={reminders.mealLog.on}
            onToggle={(v) =>
              updateSettings({
                reminders: { ...reminders, mealLog: { ...reminders.mealLog, on: v } },
              })
            }
          />
          {reminders.mealLog.on ? (
            <>
              <TimeStepperRow
                label='Midday'
                value={formatMinutes(reminders.mealLog.midday)}
                onStep={(d) =>
                  updateSettings({
                    reminders: {
                      ...reminders,
                      mealLog: {
                        ...reminders.mealLog,
                        midday: stepMinutes(reminders.mealLog.midday, d * stepStep),
                      },
                    },
                  })
                }
              />
              <TimeStepperRow
                label='Evening'
                value={formatMinutes(reminders.mealLog.evening)}
                onStep={(d) =>
                  updateSettings({
                    reminders: {
                      ...reminders,
                      mealLog: {
                        ...reminders.mealLog,
                        evening: stepMinutes(reminders.mealLog.evening, d * stepStep),
                      },
                    },
                  })
                }
              />
            </>
          ) : null}
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Weigh in</Text>
              <Text style={s.rowSub}>
                {settings.weighInFrequency === 'daily'
                  ? 'Today asks for a weight every day'
                  : 'Today asks once a week'}
              </Text>
            </View>
            <View style={s.stepper}>
              {(['daily', 'weekly'] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => updateSettings({ weighInFrequency: f })}
                  style={[s.unitItem, settings.weighInFrequency === f && s.unitItemOn]}
                  accessibilityRole='button'
                  accessibilityState={{ selected: settings.weighInFrequency === f }}
                >
                  <Text
                    style={[s.unitText, settings.weighInFrequency === f && s.unitTextOn]}
                  >
                    {f === 'daily' ? 'Daily' : 'Weekly'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <ToggleRow
            title='Weigh-in reminder'
            sub={reminderText.weighIn}
            on={reminders.weighIn.on}
            onToggle={(v) =>
              updateSettings({
                reminders: {
                  ...reminders,
                  weighIn: { ...reminders.weighIn, on: v },
                },
              })
            }
          />
          {reminders.weighIn.on ? (
            <>
              {settings.weighInFrequency === 'weekly' ? (
                <TimeStepperRow
                  label='Day'
                  value={weekdayPlural(reminders.weighIn.weekday)}
                  onStep={(d) =>
                    updateSettings({
                      reminders: {
                        ...reminders,
                        weighIn: {
                          ...reminders.weighIn,
                          weekday: stepWeekday(reminders.weighIn.weekday, d),
                        },
                      },
                    })
                  }
                />
              ) : null}
              <TimeStepperRow
                label='Time'
                value={formatMinutes(reminders.weighIn.at)}
                onStep={(d) =>
                  updateSettings({
                    reminders: {
                      ...reminders,
                      weighIn: {
                        ...reminders.weighIn,
                        at: stepMinutes(reminders.weighIn.at, d * stepStep),
                      },
                    },
                  })
                }
              />
            </>
          ) : null}
          {settings.trackWater ? (
            <>
              <ToggleRow
                title='Drink water'
                sub={reminderText.water}
                on={reminders.water.on}
                onToggle={(v) =>
                  updateSettings({ reminders: { ...reminders, water: { ...reminders.water, on: v } } })
                }
              />
              {reminders.water.on ? (
                <>
                  <TimeStepperRow
                    label='From'
                    value={formatMinutes(reminders.water.start)}
                    onStep={(d) => {
                      const start = Math.min(Math.max(reminders.water.start + d * 60, 0), 23 * 60);
                      updateSettings({
                        reminders: {
                          ...reminders,
                          water: { ...reminders.water, start, end: Math.max(reminders.water.end, start) },
                        },
                      });
                    }}
                  />
                  <TimeStepperRow
                    label='Until'
                    value={formatMinutes(reminders.water.end)}
                    onStep={(d) => {
                      const end = Math.min(Math.max(reminders.water.end + d * 60, 0), 23 * 60);
                      updateSettings({
                        reminders: {
                          ...reminders,
                          water: { ...reminders.water, end, start: Math.min(reminders.water.start, end) },
                        },
                      });
                    }}
                  />
                  <TimeStepperRow
                    label='Every'
                    value={reminders.water.everyHours === 1 ? '1 hour' : `${reminders.water.everyHours} hours`}
                    onStep={(d) =>
                      updateSettings({
                        reminders: {
                          ...reminders,
                          water: {
                            ...reminders.water,
                            everyHours: Math.min(
                              Math.max(reminders.water.everyHours + d, WATER_EVERY_HOURS.min),
                              WATER_EVERY_HOURS.max,
                            ),
                          },
                        },
                      })
                    }
                  />
                </>
              ) : null}
            </>
          ) : null}
          {settings.trackMood ? (
            <>
              <ToggleRow
                title='Check in'
                sub={reminderText.mood}
                on={reminders.mood.on}
                onToggle={(v) =>
                  updateSettings({ reminders: { ...reminders, mood: { ...reminders.mood, on: v } } })
                }
              />
              {reminders.mood.on ? (
                <TimeStepperRow
                  label='Time'
                  value={formatMinutes(reminders.mood.at)}
                  onStep={(d) =>
                    updateSettings({
                      reminders: {
                        ...reminders,
                        mood: { ...reminders.mood, at: stepMinutes(reminders.mood.at, d * stepStep) },
                      },
                    })
                  }
                />
              ) : null}
            </>
          ) : null}
        </Group>

        {dataRepo ? (
          <>
            <GroupLabel>Your data</GroupLabel>
            <Group>
              <Pressable style={s.row} onPress={exportData} disabled={dataBusy}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>Export my data</Text>
                  <Text style={s.rowSub}>A copy of everything Tern holds, as JSON</Text>
                </View>
              </Pressable>
              <Pressable style={s.row} onPress={deleteData} disabled={dataBusy}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowTitle, s.dangerText]}>Delete my data</Text>
                  <Text style={s.rowSub}>Erase your log, weigh-ins and waypoints</Text>
                </View>
              </Pressable>
              <Pressable style={s.row} onPress={deleteAccount} disabled={dataBusy}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowTitle, s.dangerText]}>Delete my account</Text>
                  <Text style={s.rowSub}>Remove your login and everything in it</Text>
                </View>
              </Pressable>
            </Group>
          </>
        ) : null}

        <GroupLabel>About</GroupLabel>
        <Group>
          <View style={s.row}>
            <Text style={[s.rowTitle, { flex: 1 }]}>Version</Text>
            <Text style={s.rowValue}>1.0.0</Text>
          </View>
        </Group>

        {auth ? (
          <View style={s.signOut}>
            {auth.isGuest ? (
              <Pressable
                onPress={() => auth.signOut({ toSignUp: true })}
                hitSlop={8}
              >
                <Text style={s.createText}>Create account</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => auth.signOut()} hitSlop={8}>
              <Text style={s.signOutText}>
                {auth.isGuest ? 'Exit preview' : 'Sign out'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <FootNote>
          Nutrition data from Open Food Facts, used under the Open Database
          License, and USDA FoodData Central.
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
  signOut: { alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  createText: { fontFamily: font.bold, fontSize: 14, color: colors.coral },
  signOutText: { fontFamily: font.semibold, fontSize: 14, color: colors.ink2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  dangerText: { color: '#B3261E' },
  nameInput: {
    fontFamily: font.medium,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
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
  unitItem: { paddingHorizontal: 16, paddingVertical: 7 },
  unitItemOn: { backgroundColor: colors.ink },
  unitText: { fontFamily: font.semibold, fontSize: 13, color: colors.ink2 },
  unitTextOn: { color: colors.paper },
  stepperVal: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
    minWidth: 52,
    textAlign: 'center',
  },
});
