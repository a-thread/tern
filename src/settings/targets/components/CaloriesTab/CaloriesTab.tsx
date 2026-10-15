import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';
import { FootNote, Group, GroupLabel, Row } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import { resolveZone } from '@/domain/food/models/intakeZone';
import { rescaleMacros } from '@/domain/food/models/macroSplit';
import { useSliderValue } from '@/settings/hooks/useSliderValue';
import { AdaptiveTargetCard } from './components/AdaptiveTargetCard/AdaptiveTargetCard';
import { ZoneStepper } from './components/ZoneStepper/ZoneStepper';

/** The range of the calorie slider, and how it steps. */
class CalorieSlider {
  static readonly MIN = 1200;
  static readonly MAX = 3500;
  static readonly STEP = 50;
}
const CHIPS = [
  { label: '−20%', factor: 0.8 },
  { label: '−10%', factor: 0.9 },
  { label: '+10%', factor: 1.1 },
] as const;
const clampCalories = (n: number) =>
  Math.min(
    Math.max(
      Math.round(n / CalorieSlider.STEP) * CalorieSlider.STEP,
      CalorieSlider.MIN,
    ),
    CalorieSlider.MAX,
  );

/** The Calories tab of Targets: the daily target, the intake-bar zone, and the adaptive suggestion. */
export function CaloriesTab() {
  const { settings, updateSettings } = useSettings();

  // Calorie changes carry the macro grams with them, so the split holds.
  const setCalories = (calorieTarget: number) =>
    updateSettings({
      calorieTarget,
      macroTargets: rescaleMacros(
        settings.macroTargets,
        settings.calorieTarget,
        calorieTarget,
      ),
    });

  const slider = useSliderValue({
    value: settings.calorieTarget,
    min: CalorieSlider.MIN,
    max: CalorieSlider.MAX,
    step: CalorieSlider.STEP,
    onCommit: setCalories,
  });

  const zone = resolveZone(settings.calorieZone, settings.calorieTarget);

  return (
    <>
      <View style={s.display}>
        <Text style={s.num}>{slider.shown.toLocaleString()}</Text>
        <Text style={s.unit}>calories per day</Text>
      </View>

      <View style={s.chips}>
        {CHIPS.map((c) => (
          <Pressable
            key={c.label}
            style={s.chip}
            onPress={() =>
              setCalories(clampCalories(settings.calorieTarget * c.factor))
            }
            accessibilityRole='button'
          >
            <Text style={s.chipText}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.slider} onLayout={slider.onLayout} {...slider.panHandlers}>
        <View style={[s.sliderFill, { width: `${slider.fillPct}%` }]} />
        <View style={[s.sliderKnob, { left: `${slider.fillPct}%` }]} />
      </View>
      <View style={s.sliderEnds}>
        <Text style={s.sliderEndText}>
          {CalorieSlider.MIN.toLocaleString()}
        </Text>
        <Text style={s.sliderEndText}>
          {CalorieSlider.MAX.toLocaleString()}
        </Text>
      </View>
      <FootNote>
        Your macro percentages stay the same when you change calories.
      </FootNote>

      {settings.showIntakeBars ? (
        <>
          <GroupLabel>Target zone</GroupLabel>
          <Group>
            <Row title='Low' right={<ZoneStepper end='min' zone={zone} />} />
            <Row title='High' right={<ZoneStepper end='max' zone={zone} />} />
          </Group>
          <FootNote>
            The range shown on your intake bars. It starts around your calorie
            target, and you can set your own.
          </FootNote>
        </>
      ) : null}

      <AdaptiveTargetCard />
    </>
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
  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: space.md,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink2 },
  slider: { height: 24, justifyContent: 'center', marginHorizontal: 6 },
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
});
