import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@shared/theme';
import { useSliderValue } from '@shared/hooks/useSliderValue';
import { useSettings } from '@/domain/settings/SettingsContext';
import { StepGoal } from '@/domain/settings/models/stepGoalHistory';

/** One tap to a common goal, under the slider. */
const PRESETS = [4800, 6000, 8000, 10000];

/**
 * The daily step goal: the number, a slider from `StepGoal.MIN` to `StepGoal.MAX` in steps of
 * 100, and a row of common goals. The same control in Settings › Step goal and the setup wizard.
 */
export function StepGoalSlider() {
  const { settings, updateSettings } = useSettings();

  const setGoal = (v: number) =>
    updateSettings({
      stepGoal:
        Math.round(Math.min(Math.max(v, StepGoal.MIN), StepGoal.MAX) / 100) *
        100,
    });

  const slider = useSliderValue({
    value: settings.stepGoal,
    min: StepGoal.MIN,
    max: StepGoal.MAX,
    step: 100,
    onCommit: (stepGoal) => updateSettings({ stepGoal }),
  });

  return (
    <View>
      <View style={s.display}>
        <Text style={s.num}>{slider.shown.toLocaleString()}</Text>
        <Text style={s.unit}>steps per day</Text>
      </View>

      <View
        style={s.slider}
        onLayout={slider.onLayout}
        accessible
        accessibilityRole='adjustable'
        accessibilityLabel='Daily step goal'
        accessibilityValue={{ text: `${slider.shown.toLocaleString()} steps` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          setGoal(
            settings.stepGoal +
              (e.nativeEvent.actionName === 'increment' ? 500 : -500),
          )
        }
        {...slider.panHandlers}
      >
        <View style={[s.sliderFill, { width: `${slider.fillPct}%` }]} />
        <View style={[s.sliderKnob, { left: `${slider.fillPct}%` }]} />
      </View>
      <View style={s.sliderEnds}>
        <Text style={s.sliderEndText}>{StepGoal.MIN.toLocaleString()}</Text>
        <Text style={s.sliderEndText}>{StepGoal.MAX.toLocaleString()}</Text>
      </View>

      <View style={s.presetRow}>
        {PRESETS.map((p) => (
          <Text
            key={p}
            onPress={() => setGoal(p)}
            style={[s.preset, slider.shown === p && s.presetSel]}
            accessibilityRole='button'
            accessibilityLabel={`${p.toLocaleString()} steps`}
            accessibilityState={{ selected: slider.shown === p }}
          >
            {p.toLocaleString()}
          </Text>
        ))}
      </View>
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
});
