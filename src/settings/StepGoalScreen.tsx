import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
} from '@shared/components/ui';
import { useActivity } from '@today/ActivityContext';
import { STEP_GOAL_MAX, STEP_GOAL_MIN, suggestGoal } from '@today/models';
import { useSettings } from './SettingsContext';
import { useSliderValue } from './useSliderValue';
import type { SettingsStackParamList } from './types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'StepGoal'>;

const MIN = STEP_GOAL_MIN;
const MAX = STEP_GOAL_MAX;
const PRESETS = [4800, 6000, 8000, 10000];

export default function StepGoalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const { days } = useActivity();

  const recent = days.slice(-30).filter((d) => d.steps > 0);
  const goalDays = recent.filter((d) => d.steps >= d.goal).length;
  const average = recent.length
    ? Math.round(recent.reduce((sum, d) => sum + d.steps, 0) / recent.length)
    : null;
  const suggestion = settings.suggestStepAdjustments
    ? suggestGoal(days, settings.stepGoal)
    : null;

  const setGoal = (v: number) =>
    updateSettings({
      stepGoal: Math.round(Math.min(Math.max(v, MIN), MAX) / 100) * 100,
    });

  const slider = useSliderValue({
    value: settings.stepGoal,
    min: MIN,
    max: MAX,
    step: 100,
    onCommit: (stepGoal) => updateSettings({ stepGoal }),
  });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Step goal'
        backLabel='Settings'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <View style={s.display}>
          <Text style={s.num}>{slider.shown.toLocaleString()}</Text>
          <Text style={s.unit}>steps per day</Text>
        </View>

        <View
          style={s.slider}
          onLayout={slider.onLayout}
          {...slider.panHandlers}
        >
          <View style={[s.sliderFill, { width: `${slider.fillPct}%` }]} />
          <View style={[s.sliderKnob, { left: `${slider.fillPct}%` }]} />
        </View>
        <View style={s.sliderEnds}>
          <Text style={s.sliderEndText}>{MIN.toLocaleString()}</Text>
          <Text style={s.sliderEndText}>{MAX.toLocaleString()}</Text>
        </View>

        <View style={s.presetRow}>
          {PRESETS.map((p) => (
            <Text
              key={p}
              onPress={() => setGoal(p)}
              style={[s.preset, slider.shown === p && s.presetSel]}
            >
              {p.toLocaleString()}
            </Text>
          ))}
        </View>

        <GroupLabel>Based on your history</GroupLabel>
        <View style={s.card}>
          {average !== null && recent.length >= 3 ? (
            <Text style={s.historyText}>
              You've averaged{' '}
              <Text style={s.bold}>{average.toLocaleString()} steps</Text> over
              the last {recent.length} days with step data, and reached your
              goal on {goalDays} of them.
            </Text>
          ) : (
            <Text style={s.historyText}>
              Once Tern has a few days of steps, your history shows up here.
            </Text>
          )}
        </View>

        <GroupLabel>Adjusting</GroupLabel>
        <Group>
          <ToggleRow
            title='Suggest adjustments'
            sub="Tern can propose a new goal monthly based on what you're actually doing"
            on={settings.suggestStepAdjustments}
            onToggle={(v) => updateSettings({ suggestStepAdjustments: v })}
          />
        </Group>

        {suggestion !== null ? (
          <View style={[s.card, { marginTop: space.md }]}>
            <Text style={s.historyText}>
              {suggestion < settings.stepGoal
                ? `Most days land below ${settings.stepGoal.toLocaleString()}. A goal of ${suggestion.toLocaleString()} might feel more reachable.`
                : `You've reached your goal on nearly every day lately. ${suggestion.toLocaleString()} is there if you want a bit more. Staying put is fine too.`}
            </Text>
            <Text style={s.suggestLink} onPress={() => setGoal(suggestion)}>
              Use {suggestion.toLocaleString()}
            </Text>
          </View>
        ) : null}

        <Text style={s.footNote}>
          Changing your goal never touches past days: your streak and the
          waypoints you've earned stay yours. Today counts toward whichever goal
          you finish the day with. A goal you can hit most days works better
          than one you can't.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  display: { alignItems: 'center', paddingVertical: 18 },
  num: {
    fontFamily: font.displayMedium,
    fontSize: 42,
    color: colors.ink,
    lineHeight: 46,
  },
  unit: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink2,
    marginTop: 4,
  },
  slider: {
    height: 24,
    justifyContent: 'center',
    marginHorizontal: 6,
    marginTop: 10,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  sliderKnob: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: colors.coral,
  },
  sliderEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 4,
  },
  suggestLink: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
    marginTop: space.sm,
  },
  sliderEndText: { fontFamily: font.body, fontSize: 10.5, color: colors.ink3 },
  presetRow: { flexDirection: 'row', gap: 7, marginTop: 14 },
  preset: {
    flex: 1,
    textAlign: 'center',
    fontFamily: font.body,
    fontSize: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#fff',
    color: colors.ink2,
    overflow: 'hidden',
  },
  presetSel: {
    borderColor: colors.coral,
    backgroundColor: colors.coralTint,
    color: colors.ink,
    fontFamily: font.bold,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
  },
  historyText: {
    fontFamily: font.body,
    fontSize: 12.5,
    color: colors.ink2,
    lineHeight: 19,
  },
  bold: { fontFamily: font.semibold, color: colors.ink },
  footNote: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 17,
    color: colors.ink3,
    paddingHorizontal: space.sm,
    paddingTop: space.md,
  },
});
