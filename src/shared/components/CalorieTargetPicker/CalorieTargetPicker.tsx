import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, typography } from '../../theme';
import { useSliderValue } from '../../hooks/useSliderValue';
import { useSettings } from '@/domain/settings/SettingsContext';
import { CalorieTarget } from '@/domain/food/models/calorieTarget';
import { rescaleMacros } from '@/domain/food/models/macroSplit';

/**
 * The daily calorie target: the number, quick −20% / −10% / +10% chips and a slider. Macro grams
 * move with it so the split holds. Used by Settings › Targets and the setup wizard.
 */
export function CalorieTargetPicker() {
  const { settings, updateSettings } = useSettings();

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
    min: CalorieTarget.MIN,
    max: CalorieTarget.MAX,
    step: CalorieTarget.STEP,
    onCommit: setCalories,
  });

  return (
    <>
      <View style={s.display}>
        <Text style={s.num}>{slider.shown.toLocaleString()}</Text>
        <Text style={s.unit}>calories per day</Text>
      </View>

      <View style={s.chips}>
        {CalorieTarget.CHIPS.map((c) => (
          <Pressable
            key={c.label}
            style={s.chip}
            onPress={() =>
              setCalories(
                CalorieTarget.clamp(settings.calorieTarget * c.factor),
              )
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
          {CalorieTarget.MIN.toLocaleString()}
        </Text>
        <Text style={s.sliderEndText}>
          {CalorieTarget.MAX.toLocaleString()}
        </Text>
      </View>
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
  sliderEndText: typography.tick,
});
