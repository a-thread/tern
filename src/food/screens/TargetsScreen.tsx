import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, space } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
  FootNote,
  SegmentedControl,
  Stepper,
  Row,
  BottomSheet,
} from '@shared/components/ui';
import { useSettings } from '@settings/SettingsContext';
import { AdaptiveTargetCard } from '@food/components/AdaptiveTargetCard';
import { useSliderValue } from '@shared/hooks/useSliderValue';
import { nudgeZone, resolveZone, type CalorieZone } from '@food/models/intakeZone';
import {
  gramRange,
  isValidSplit,
  macrosFromPercents,
  matchPreset,
  percentsFromMacros,
  rescaleMacros,
  splitTotal,
  MacroSplits,
  type MacroKey,
  type MacroSplit,
} from '@food/models/macroSplit';

const MIN = 1200;
const MAX = 3500;
const CAL_STEP = 50;
const TABS = ['calories', 'macros'] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  calories: 'Calories',
  macros: 'Macros',
};
const CHIPS = [
  { label: '−20%', factor: 0.8 },
  { label: '−10%', factor: 0.9 },
  { label: '+10%', factor: 1.1 },
] as const;
const MACRO_LABEL: Record<MacroKey, string> = {
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
};

const clampCalories = (n: number) =>
  Math.min(Math.max(Math.round(n / CAL_STEP) * CAL_STEP, MIN), MAX);

export default function TargetsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const [tab, setTab] = useState<Tab>('calories');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MacroSplit>(() =>
    percentsFromMacros(settings.macroTargets),
  );

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
    min: MIN,
    max: MAX,
    step: CAL_STEP,
    onCommit: setCalories,
  });

  const zone = resolveZone(settings.calorieZone, settings.calorieTarget);
  const split = percentsFromMacros(settings.macroTargets);
  const selected = matchPreset(split);

  const applySplit = (next: MacroSplit) =>
    updateSettings({
      macroTargets: macrosFromPercents(settings.calorieTarget, next),
    });

  const openCustom = () => {
    setDraft(split);
    setEditing(true);
  };

  const nudgeDraft = (key: MacroKey, direction: 1 | -1) =>
    setDraft((d) => {
      const value = d[key] + direction * MacroSplits.STEP;
      if (value < MacroSplits.MIN_PERCENT || value > MacroSplits.MAX_PERCENT) {
        return d;
      }
      return { ...d, [key]: value };
    });

  const total = splitTotal(draft);
  const valid = isValidSplit(draft);

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Targets'
        backLabel='Settings'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <Group style={{ marginTop: 6 }}>
          <ToggleRow
            title='Track calories & macros'
            sub='Off logs meals with no targets at all'
            on={settings.trackCalories}
            onToggle={(v) => updateSettings({ trackCalories: v })}
          />
        </Group>

        {settings.trackCalories ? (
          <>
            <SegmentedControl
              style={{ marginTop: space.md }}
              options={TABS}
              value={tab}
              onChange={setTab}
              label={(t) => TAB_LABEL[t]}
            />

            {tab === 'calories' ? (
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
                        setCalories(
                          clampCalories(settings.calorieTarget * c.factor),
                        )
                      }
                      accessibilityRole='button'
                    >
                      <Text style={s.chipText}>{c.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <View
                  style={s.slider}
                  onLayout={slider.onLayout}
                  {...slider.panHandlers}
                >
                  <View
                    style={[s.sliderFill, { width: `${slider.fillPct}%` }]}
                  />
                  <View
                    style={[s.sliderKnob, { left: `${slider.fillPct}%` }]}
                  />
                </View>
                <View style={s.sliderEnds}>
                  <Text style={s.sliderEndText}>{MIN.toLocaleString()}</Text>
                  <Text style={s.sliderEndText}>{MAX.toLocaleString()}</Text>
                </View>
                <FootNote>
                  Your macro percentages stay the same when you change calories.
                </FootNote>

                {settings.showIntakeBars ? (
                  <>
                    <GroupLabel>Target zone</GroupLabel>
                    <Group>
                      <Row
                        title='Low'
                        right={<ZoneStepper end='min' zone={zone} />}
                      />
                      <Row
                        title='High'
                        right={<ZoneStepper end='max' zone={zone} />}
                      />
                    </Group>
                    <FootNote>
                      The range shown on your intake bars. It starts around your
                      calorie target, and you can set your own.
                    </FootNote>
                  </>
                ) : null}

                <AdaptiveTargetCard />
              </>
            ) : (
              <>
                <GroupLabel>Macro split</GroupLabel>
                <Group>
                  {MacroSplits.PRESETS.map((p) => {
                    const on = selected?.key === p.key;
                    return (
                      <Pressable
                        key={p.key}
                        style={s.presetRow}
                        android_ripple={{ color: colors.doveTint }}
                        onPress={() => applySplit(p.split)}
                        accessibilityRole='radio'
                        accessibilityState={{ selected: on }}
                      >
                        <Radio on={on} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.rowTitle}>{p.name}</Text>
                          <Text style={s.rowSub}>{p.sub}</Text>
                          {on ? <SplitDetail split={split} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    style={s.presetRow}
                    android_ripple={{ color: colors.doveTint }}
                    onPress={openCustom}
                    accessibilityRole='radio'
                    accessibilityState={{ selected: !selected }}
                  >
                    <Radio on={!selected} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowTitle}>Custom</Text>
                      <Text style={s.rowSub}>Set your own split</Text>
                      {!selected ? <SplitDetail split={split} /> : null}
                    </View>
                  </Pressable>
                </Group>

                {settings.showIntakeBars ? (
                  <>
                    <GroupLabel>Intake bars</GroupLabel>
                    <Group>
                      <ToggleRow
                        title='Protein as a minimum'
                        sub='Something to reach, not a limit'
                        on={settings.proteinAsMinimum}
                        onToggle={(v) => updateSettings({ proteinAsMinimum: v })}
                      />
                    </Group>
                  </>
                ) : null}
              </>
            )}

            <FootNote>
              Targets are a reference point, not a limit. Tern won't alert you
              for going over, and going over never affects your streak or
              waypoints.
            </FootNote>
          </>
        ) : (
          <FootNote>
            Meals still log calories and macros in the background — they're just
            not shown as a target.
          </FootNote>
        )}
      </ScrollView>

      <BottomSheet visible={editing} onClose={() => setEditing(false)}>
        <View>
          <View style={s.sheetTop}>
            <Text style={s.sheetTitle}>Custom split</Text>
            <Pressable
              onPress={() => setEditing(false)}
              hitSlop={10}
              accessibilityLabel='Close'
            >
              <Text style={s.close}>×</Text>
            </Pressable>
          </View>

          <View style={s.cols}>
            {MacroSplits.KEYS.map((key) => {
              const range = gramRange(
                settings.calorieTarget,
                draft[key],
                key,
              );
              return (
                <View key={key} style={s.col}>
                  <Text style={s.rowTitle}>{MACRO_LABEL[key]}</Text>
                  <Text style={s.rowSub}>
                    {range.low}-{range.high} g
                  </Text>
                  <Stepper
                    style={{ marginTop: 10 }}
                    value={`${draft[key]}%`}
                    valueMinWidth={46}
                    decrementLabel={`Lower ${MACRO_LABEL[key]}`}
                    incrementLabel={`Raise ${MACRO_LABEL[key]}`}
                    onDecrement={() => nudgeDraft(key, -1)}
                    onIncrement={() => nudgeDraft(key, 1)}
                  />
                </View>
              );
            })}
          </View>

          <View style={s.totalRow}>
            <Text style={s.rowTitle}>Total</Text>
            <Text style={[s.total, valid && { color: colors.kelp }]}>
              {total}%
            </Text>
          </View>
          {!valid ? (
            <Text style={s.hint}>Total must equal 100%</Text>
          ) : null}

          <Pressable
            style={[s.update, !valid && s.updateOff]}
            disabled={!valid}
            onPress={() => {
              applySplit(draft);
              setEditing(false);
            }}
            accessibilityRole='button'
            accessibilityState={{ disabled: !valid }}
          >
            <Text style={s.updateText}>Update</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

/** One end of the calorie zone, stepped in tens; the zone keeps its minimum gap. */
function ZoneStepper({ end, zone }: { end: 'min' | 'max'; zone: CalorieZone }) {
  const { updateSettings } = useSettings();
  const label = end === 'min' ? 'minimum' : 'maximum';
  return (
    <Stepper
      value={zone[end].toLocaleString()}
      valueMinWidth={56}
      decrementLabel={`Lower the zone ${label}`}
      incrementLabel={`Raise the zone ${label}`}
      onDecrement={() => updateSettings({ calorieZone: nudgeZone(zone, end, -1) })}
      onIncrement={() => updateSettings({ calorieZone: nudgeZone(zone, end, 1) })}
    />
  );
}

function Radio({ on }: { on: boolean }) {
  return <View style={[s.radio, on && s.radioOn]} />;
}

function SplitDetail({ split }: { split: MacroSplit }) {
  const { settings } = useSettings();
  return (
    <View style={{ marginTop: 6, gap: 2 }}>
      {MacroSplits.KEYS.map((key) => {
        const range = gramRange(settings.calorieTarget, split[key], key);
        return (
          <Text key={key} style={s.rowSub}>
            {split[key]}% {MACRO_LABEL[key].toLowerCase()} · {range.low}-
            {range.high} g
          </Text>
        );
      })}
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
  presetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: 1,
  },
  radioOn: { borderWidth: 5, borderColor: colors.coral },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 2,
  },
  sheetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  sheetTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  close: { fontFamily: font.body, fontSize: 24, color: colors.ink3 },
  cols: { flexDirection: 'row', gap: 8 },
  col: { flex: 1, alignItems: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  total: { fontFamily: font.semibold, fontSize: 15, color: colors.ink2 },
  hint: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 4,
  },
  update: {
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: space.lg,
  },
  updateOff: { opacity: 0.4 },
  updateText: { fontFamily: font.bold, fontSize: 14, color: '#fff' },
});
