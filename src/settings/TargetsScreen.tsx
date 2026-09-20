import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, space } from '@shared/theme';
import {
  Group,
  GroupLabel,
  PushHeader,
  ToggleRow,
  FootNote,
} from '@shared/components/ui';
import { useSettings } from './SettingsContext';
import type { SettingsStackParamList } from './types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Targets'>;

const MIN = 1200;
const MAX = 3500;

const MACRO_PRESETS = [
  { name: 'Higher protein', protein: 0.3, carbs: 0.4, fat: 0.3 },
  { name: 'Lower carb', protein: 0.3, carbs: 0.25, fat: 0.45 },
] as const;

export default function TargetsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const trackWidth = useRef(0);
  const dragStartTarget = useRef(settings.calorieTarget);
  // The drag handler is created once, so it reads the live value from a ref.
  const targetRef = useRef(settings.calorieTarget);
  targetRef.current = settings.calorieTarget;

  const setCalorieTarget = (v: number) =>
    updateSettings({
      calorieTarget: Math.round(Math.min(Math.max(v, MIN), MAX) / 50) * 50,
    });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStartTarget.current = targetRef.current;
      },
      onPanResponderMove: (_evt, gesture) => {
        if (!trackWidth.current) return;
        const delta = (gesture.dx / trackWidth.current) * (MAX - MIN);
        setCalorieTarget(dragStartTarget.current + delta);
      },
    }),
  ).current;

  const applyPreset = (protein: number, carbs: number, fat: number) => {
    const cal = settings.calorieTarget;
    updateSettings({
      macroTargets: {
        protein: Math.round((cal * protein) / 4),
        carbs: Math.round((cal * carbs) / 4),
        fat: Math.round((cal * fat) / 9),
      },
    });
  };

  const { protein, carbs, fat } = settings.macroTargets;
  const pct = (grams: number, calPerGram: number) =>
    Math.round(((grams * calPerGram) / settings.calorieTarget) * 100);
  const fillPct = ((settings.calorieTarget - MIN) / (MAX - MIN)) * 100;

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
            <View style={s.display}>
              <Text style={s.num}>
                {settings.calorieTarget.toLocaleString()}
              </Text>
              <Text style={s.unit}>calories per day</Text>
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

            <GroupLabel>Macro split</GroupLabel>
            <Group>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>Protein</Text>
                  <Text style={s.rowSub}>
                    {protein} g · {pct(protein, 4)}%
                  </Text>
                </View>
              </View>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>Carbs</Text>
                  <Text style={s.rowSub}>
                    {carbs} g · {pct(carbs, 4)}%
                  </Text>
                </View>
              </View>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>Fat</Text>
                  <Text style={s.rowSub}>
                    {fat} g · {pct(fat, 9)}%
                  </Text>
                </View>
              </View>
            </Group>

            <GroupLabel>Presets</GroupLabel>
            <Group>
              <View style={s.row}>
                <Text style={[s.rowTitle, { flex: 1 }]}>Balanced</Text>
                <Text style={s.rowValue}>current</Text>
              </View>
              {MACRO_PRESETS.map((p) => (
                <Pressable
                  key={p.name}
                  style={s.row}
                  android_ripple={{ color: colors.doveTint }}
                  onPress={() => applyPreset(p.protein, p.carbs, p.fat)}
                >
                  <Text style={[s.rowTitle, { flex: 1 }]}>{p.name}</Text>
                </Pressable>
              ))}
            </Group>

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  rowValue: { fontFamily: font.body, fontSize: 13, color: colors.ink2 },
});
