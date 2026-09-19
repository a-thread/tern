import React, { useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
} from '@shared/components/ui';
import { useSettings } from './SettingsContext';
import type { SettingsStackParamList } from './types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'StepGoal'>;

const MIN = 2000;
const MAX = 15000;
const PRESETS = [4000, 6000, 8000, 10000];

export default function StepGoalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const trackWidth = useRef(0);
  const dragStartGoal = useRef(settings.stepGoal);

  const setGoal = (v: number) =>
    updateSettings({
      stepGoal: Math.round(Math.min(Math.max(v, MIN), MAX) / 100) * 100,
    });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartGoal.current = settings.stepGoal;
      },
      onPanResponderMove: (_evt, gesture) => {
        if (!trackWidth.current) return;
        const deltaSteps = (gesture.dx / trackWidth.current) * (MAX - MIN);
        setGoal(dragStartGoal.current + deltaSteps);
      },
    }),
  ).current;

  const fillPct = ((settings.stepGoal - MIN) / (MAX - MIN)) * 100;

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
          <Text style={s.num}>{settings.stepGoal.toLocaleString()}</Text>
          <Text style={s.unit}>steps per day</Text>
        </View>

        <View
          style={s.slider}
          onLayout={(e) => {
            trackWidth.current = e.nativeEvent.layout.width;
          }}
          {...panResponder.panHandlers}
        >
          <View style={[s.sliderFill, { width: `${fillPct}%` }]} />
          <View style={[s.sliderKnob, { left: `${fillPct}%` }]} />
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
              style={[s.preset, settings.stepGoal === p && s.presetSel]}
            >
              {p.toLocaleString()}
            </Text>
          ))}
        </View>

        <GroupLabel>Based on your history</GroupLabel>
        <View style={s.card}>
          <Text style={s.historyText}>
            You've averaged <Text style={s.bold}>6,400 steps</Text> over the
            last 30 days, and reached {settings.stepGoal.toLocaleString()} on 12
            of them.
          </Text>
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

        <Text style={s.footNote}>
          Lowering your goal doesn't reset your streak or lose waypoints. A goal
          you can hit most days works better than one you can't.
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
