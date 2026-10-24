import React, { useMemo, useRef, useState } from 'react';
import { round1 } from '@shared/utils/number';
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
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space, typography } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { WeightTrend } from '@shared/components/WeightTrend';
import type { RootStackParamList } from '../navigation/types';
import { useUnits } from '../domain/settings/hooks/useUnits';
import { useWeight } from '../domain/weight/WeightContext';
import { isLoggedOn } from '../domain/weight/models/weightEntry';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { atTimeOn, dayWord } from '@shared/utils/date';
import { Units } from '@shared/utils/units';

type Props = NativeStackScreenProps<RootStackParamList, 'LogWeight'>;

const PX_PER_UNIT = 110; // drag distance for a 1 lb (or 1 kg) change
// The range the database accepts, in pounds.
const MIN_LB = 40;
const MAX_LB = 1100;
// Where the ruler sits before a first weigh-in; never saved unless the user moves it.
const STARTING_LB = 170;

export default function LogWeightScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    weightEntries,
    weightTrend,
    addWeightEntry,
    updateWeightEntry,
    setWeighInSkipped,
  } = useWeight();
  // The viewed day: today, or yesterday when filling it in from a past day.
  const { day, today, isToday } = useViewedDay();
  // Opening this after weighing in that day edits that weigh-in rather than stacking a second one.
  const todaysEntry = weightEntries.find((e) => isLoggedOn(e.loggedAt, day));
  const { units, weightLabel, toDisplay, fromDisplay, formatWeight } =
    useUnits();
  // The ruler works in the user's unit; storage stays lb. With nothing logged yet there is
  // no weight to start from, so the field starts empty rather than at a made-up number.
  const knownLb = todaysEntry?.lb ?? weightEntries[0]?.lb;
  const latest =
    knownLb === undefined ? null : Math.round(toDisplay(knownLb) * 10) / 10;
  // Where the ruler and steppers start from while the field is still empty.
  const rulerStart = Math.round(toDisplay(STARTING_LB) * 10) / 10;

  const min = Math.ceil(toDisplay(MIN_LB) * 10) / 10;
  const max = Math.floor(toDisplay(MAX_LB) * 10) / 10;
  const clamp = (v: number) => Math.min(Math.max(v, min), max);

  const [weight, setWeightState] = useState<number | null>(latest);
  const weightRef = useRef(latest);
  const setWeight = (v: number) => {
    const next = clamp(round1(v));
    weightRef.current = next;
    setWeightState(next);
  };
  const dragStart = useRef(latest ?? rulerStart);
  const [draft, setDraft] = useState<string | null>(null); // while typing

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStart.current = weightRef.current ?? rulerStart;
      },
      onPanResponderMove: (_evt, gesture) => {
        setWeight(dragStart.current - gesture.dx / PX_PER_UNIT);
      },
    }),
  ).current;

  // The typed value, if there is one, or what the ruler shows. Save reads this too, so a
  // number typed and saved without leaving the field isn't lost.
  const typedOrCurrent = () => {
    const typed = parseFloat((draft ?? '').replace(',', '.'));
    return Number.isNaN(typed) ? weightRef.current : clamp(round1(typed));
  };

  const commitDraft = () => {
    const next = typedOrCurrent();
    if (next !== null) setWeight(next);
    setDraft(null);
  };

  const ticks = useMemo(() => {
    const centre = weight ?? rulerStart;
    const list: { v: number; major: boolean }[] = [];
    for (let i = -16; i <= 16; i++) {
      const v = round1(centre + i * 0.1);
      list.push({ v, major: Math.round(v * 10) % 5 === 0 });
    }
    return list;
  }, [weight, rulerStart]);

  const week = weightTrend.slice(-7);
  const weekAvgLb = week.length
    ? week.reduce((a, b) => a + b, 0) / week.length
    : null;

  const save = () => {
    const value = typedOrCurrent();
    if (value === null) return;
    if (todaysEntry) updateWeightEntry(todaysEntry.id, fromDisplay(value));
    else
      addWeightEntry(fromDisplay(value), isToday ? undefined : atTimeOn(day));
    navigation.goBack();
  };
  const canSave = weight !== null || typedOrCurrent() !== null;

  const skip = () => {
    setWeighInSkipped(day, true);
    navigation.goBack();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title={todaysEntry ? 'Edit weight' : 'Log weight'}
        leftLabel='Cancel'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Save'
        onRightPress={save}
        rightDisabled={!canSave}
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
            value={draft ?? weight?.toFixed(1) ?? ''}
            placeholder='—'
            placeholderTextColor={colors.ink3}
            autoFocus={weight === null}
            onFocus={() => setDraft(weight?.toFixed(1) ?? '')}
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
              onPress={() => {
                Haptics.selectionAsync();
                setWeight((weightRef.current ?? rulerStart) + d);
              }}
              style={s.stepBtn}
              accessibilityRole='button'
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

        {!todaysEntry ? (
          <Pressable
            onPress={skip}
            style={s.skip}
            hitSlop={8}
            accessibilityRole='button'
            accessibilityLabel={`Skip weighing in ${dayWord(day, today).toLowerCase()}`}
          >
            <Text style={s.skipText}>{`Skip ${dayWord(day, today)}`}</Text>
          </Pressable>
        ) : null}

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
            <Text style={s.rowSub}>{dayWord(day, today)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowTitle}>Units</Text>
            <Text style={s.rowSub}>
              {units === Units.Imperial ? 'Pounds' : 'Kilograms'}
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
  tickLabel: { ...typography.tick, position: 'absolute', top: 28 },
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
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  skip: { alignSelf: 'center', paddingVertical: space.sm, marginTop: space.sm },
  skipText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.coral },
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
  weekSub: typography.caption,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowTitle: typography.rowTitle,
  rowSub: { fontFamily: font.body, fontSize: 12, color: colors.ink2 },
});
