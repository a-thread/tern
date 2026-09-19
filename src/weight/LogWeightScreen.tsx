import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { WeightTrend } from '@shared/components/charts';
import type { RootStackParamList } from '@shared/navigation/types';
import { useWeight } from './WeightContext';

type Props = NativeStackScreenProps<RootStackParamList, 'LogWeight'>;

const PX_PER_KG = 110; // drag distance for a 1 kg change

export default function LogWeightScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { weightEntries, weightTrend, addWeightEntry } = useWeight();
  const latest = weightEntries[0]?.kg ?? 78.2;

  const [weight, setWeight] = useState(latest);
  const dragStart = useRef(latest);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStart.current = weight;
      },
      onPanResponderMove: (_evt, gesture) => {
        const next = dragStart.current - gesture.dx / PX_PER_KG;
        setWeight(Math.round(next * 10) / 10);
      },
    }),
  ).current;

  const ticks = useMemo(() => {
    const list: { v: number; major: boolean }[] = [];
    for (let i = -16; i <= 16; i++) {
      const v = Math.round((weight + i * 0.1) * 10) / 10;
      list.push({ v, major: Math.round(v * 10) % 5 === 0 });
    }
    return list;
  }, [weight]);

  const week = weightTrend.slice(-7);
  const weekAvg = week.length
    ? week.reduce((a, b) => a + b, 0) / week.length
    : null;

  const save = () => {
    addWeightEntry(weight);
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
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <View style={s.display}>
          <Text style={s.val}>{weight.toFixed(1)}</Text>
          <Text style={s.unit}>kg</Text>
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

        <Text style={s.hint}>
          Day-to-day changes are mostly water. Tern tracks your weekly average
          instead.
        </Text>

        {weekAvg !== null ? (
          <>
            <GroupLabel>This week</GroupLabel>
            <View style={s.weekCard}>
              <View style={s.weekTop}>
                <Text style={s.weekVal}>{weekAvg.toFixed(1)} kg</Text>
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
            <Text style={s.rowSub}>Kilograms</Text>
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
  val: {
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
