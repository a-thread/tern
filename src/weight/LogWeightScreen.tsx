import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { WeightTrend } from '@shared/components/charts';
import type { RootStackParamList } from '@shared/navigation/types';
import { useUnits } from '@settings/useUnits';
import { useWeight } from './WeightContext';

type Props = NativeStackScreenProps<RootStackParamList, 'LogWeight'>;

const PX_PER_UNIT = 110; // drag distance for a 1 lb (or 1 kg) change
// The range the database accepts, in pounds.
const MIN_LB = 40;
const MAX_LB = 1100;

export default function LogWeightScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { weightEntries, weightTrend, addWeightEntry } = useWeight();
  const { units, weightLabel, toDisplay, fromDisplay, formatWeight } =
    useUnits();
  // The ruler works in the user's unit; storage stays lb.
  const latest = Math.round(toDisplay(weightEntries[0]?.lb ?? 172.4) * 10) / 10;

  const min = Math.ceil(toDisplay(MIN_LB) * 10) / 10;
  const max = Math.floor(toDisplay(MAX_LB) * 10) / 10;
  const clamp = (v: number) => Math.min(Math.max(v, min), max);

  const [weight, setWeightState] = useState(latest);
  const weightRef = useRef(latest);
  const setWeight = (v: number) => {
    const next = clamp(Math.round(v * 10) / 10);
    weightRef.current = next;
    setWeightState(next);
  };
  const dragStart = useRef(latest);
  const [draft, setDraft] = useState<string | null>(null); // while typing

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStart.current = weightRef.current;
      },
      onPanResponderMove: (_evt, gesture) => {
        setWeight(dragStart.current - gesture.dx / PX_PER_UNIT);
      },
    }),
  ).current;

  const commitDraft = () => {
    const typed = parseFloat((draft ?? '').replace(',', '.'));
    if (!Number.isNaN(typed)) setWeight(typed);
    setDraft(null);
  };

  const ticks = useMemo(() => {
    const list: { v: number; major: boolean }[] = [];
    for (let i = -16; i <= 16; i++) {
      const v = Math.round((weight + i * 0.1) * 10) / 10;
      list.push({ v, major: Math.round(v * 10) % 5 === 0 });
    }
    return list;
  }, [weight]);

  const week = weightTrend.slice(-7);
  const weekAvgLb = week.length
    ? week.reduce((a, b) => a + b, 0) / week.length
    : null;

  const save = () => {
    addWeightEntry(fromDisplay(weight));
    navigation.goBack();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='Log weight'
        leftLabel='Cancel'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Save'
        onRightPress={save}
      />

      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <View style={s.display}>
          <TextInput
            style={s.val}
            value={draft ?? weight.toFixed(1)}
            onFocus={() => setDraft(weight.toFixed(1))}
            onChangeText={setDraft}
            onBlur={commitDraft}
            onSubmitEditing={commitDraft}
            keyboardType='decimal-pad'
            selectTextOnFocus
            maxLength={6}
            accessibilityLabel='Weight'
          />
          <Text style={s.unit}>{weightLabel}</Text>
        </View>

        <View style={s.ruler} {...panResponder.panHandlers}>
          <View style={s.rulerTrack}>
            {ticks.map((t, i) => (
              <View key={i} style={s.tickCol}>
                <View style={[s.tickLine, t.major && s.tickLineMajor]} />
                {t.major ? (
                  <Text style={s.tickLabel}>{t.v.toFixed(1)}</Text>
                ) : null}
              </View>
            ))}
          </View>
          <View style={s.needle} pointerEvents='none' />
        </View>

        <View style={s.stepRow}>
          {[-1, -0.1, 0.1, 1].map((d) => (
            <Pressable
              key={d}
              onPress={() => setWeight(weightRef.current + d)}
              style={s.stepBtn}
              accessibilityLabel={`${d > 0 ? 'Add' : 'Subtract'} ${Math.abs(d)} ${weightLabel}`}
            >
              <Text style={s.stepText}>
                {d > 0 ? '+' : '−'}
                {Math.abs(d)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.hint}>
          Day-to-day changes are mostly water. Tern tracks your weekly average
          instead.
        </Text>

        {weekAvgLb !== null ? (
          <>
            <GroupLabel>This week</GroupLabel>
            <View style={s.weekCard}>
              <View style={s.weekTop}>
                <Text style={s.weekVal}>{formatWeight(weekAvgLb)}</Text>
                <Text style={s.weekSub}>7-day average</Text>
              </View>
              <WeightTrend trend={week} spread={0.5} height={44} />
            </View>
          </>
        ) : null}

        <GroupLabel>Details</GroupLabel>
        <Group>
          <View style={s.row}>
            <Text style={s.rowTitle}>Date</Text>
            <Text style={s.rowSub}>Today</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowTitle}>Units</Text>
            <Text style={s.rowSub}>
              {units === 'imperial' ? 'Pounds' : 'Kilograms'}
            </Text>
          </View>
        </Group>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  display: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    marginBottom: space.md,
  },
  stepBtn: {
    minWidth: 56,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  stepText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.ink },
  val: {
    padding: 0,
    minWidth: 90,
    textAlign: 'center',
    fontFamily: font.displayMedium,
    fontSize: 46,
    color: colors.ink,
    lineHeight: 50,
  },
  unit: {
    fontFamily: font.body,
    fontSize: 15,
    color: colors.ink2,
    marginLeft: 5,
    marginTop: 14,
  },
  ruler: {
    height: 66,
    marginBottom: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  rulerTrack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 44,
    width: 33 * 11,
    alignSelf: 'center',
  },
  tickCol: { width: 11, alignItems: 'center' },
  tickLine: { width: 1.5, height: 13, backgroundColor: colors.dove },
  tickLineMajor: { height: 26, width: 2, backgroundColor: colors.ink3 },
  tickLabel: {
    position: 'absolute',
    top: 28,
    fontSize: 8.5,
    color: colors.ink3,
    fontFamily: font.body,
  },
  needle: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2.5,
    height: 46,
    marginLeft: -1.25,
    backgroundColor: colors.coral,
    borderRadius: 2,
  },
  hint: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  weekCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
  },
  weekTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  weekVal: { fontFamily: font.displayMedium, fontSize: 19, color: colors.ink },
  weekSub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowSub: { fontFamily: font.body, fontSize: 12, color: colors.ink2 },
});
