import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { PushHeader, SegmentedControl, Stepper } from '@shared/components/ui';
import { useUnits } from '@settings/hooks/useUnits';
import { useMovement } from '@movement/MovementContext';
import { ActivityGlyph } from '@movement/components/ActivityGlyph';
import { MinutesRuler } from '@movement/components/MinutesRuler';
import type { MovementStackParamList } from '@movement/navigation';
import {
  ACTIVITY_INFO,
  countsTowardGoal,
  distanceFromDisplay,
  distanceToDisplay,
  distanceUnit,
  Effort,
  EFFORT_LABEL,
  formatDistance,
  MovementLimits,
} from '@movement/models/movementEntry';

type Props = NativeStackScreenProps<MovementStackParamList, 'ExerciseDetail'>;

const EFFORTS = Object.values(Effort);

/** In tenths of a mile or kilometer. */
const DISTANCE_STEP = 0.1;

const GUIDE: { effort: Effort; text: string }[] = [
  { effort: Effort.Easy, text: 'Breathing stays easy and you could hold a full conversation.' },
  { effort: Effort.Moderate, text: 'Breathing picks up, and talking takes some effort.' },
  { effort: Effort.Hard, text: "Breathing hard: a few words at a time is all you've got." },
];

/** One exercise's details: how long (on a ruler), how hard, and how far where it applies. */
export default function ExerciseDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activity, day } = route.params;
  const info = ACTIVITY_INFO[activity];
  const { add } = useMovement();
  const { units } = useUnits();
  const [minutes, setMinutes] = useState<number>(MovementLimits.DEFAULT_MINUTES);
  const [effort, setEffort] = useState<Effort>(Effort.Moderate);
  const [distanceM, setDistanceM] = useState<number>(0);

  const stepDistance = (dir: 1 | -1) => {
    const shown = Math.round(distanceToDisplay(distanceM, units) * 10) / 10;
    const next = Math.max(0, Math.round((shown + dir * DISTANCE_STEP) * 10) / 10);
    setDistanceM(Math.min(distanceFromDisplay(next, units), MovementLimits.MAX_DISTANCE_M));
  };

  const save = () => {
    if (add({ day, activity, minutes, effort, distanceM: distanceM || null })) {
      navigation.getParent()?.goBack();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <PushHeader title='Exercise' backLabel='Exercises' onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.row}>
          <Text style={s.name}>{info.label}</Text>
          <ActivityGlyph activity={activity} size={28} />
        </View>

        <View style={s.row}>
          <Text style={s.rowTitle}>Duration</Text>
          <Text style={s.value}>{`${minutes} min`}</Text>
        </View>
        <MinutesRuler value={minutes} onChange={setMinutes} />

        <View style={s.block}>
          <Text style={s.label}>Intensity</Text>
          <SegmentedControl
            options={EFFORTS}
            value={effort}
            onChange={setEffort}
            label={(e) => EFFORT_LABEL[e]}
          />
        </View>

        {info.distance ? (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Distance</Text>
              <Text style={s.sub}>Optional</Text>
            </View>
            <Stepper
              value={distanceM ? formatDistance(distanceM, units) : `— ${distanceUnit(units)}`}
              valueMinWidth={64}
              decrementLabel='Less distance'
              incrementLabel='More distance'
              onDecrement={() => stepDistance(-1)}
              onIncrement={() => stepDistance(1)}
            />
          </View>
        ) : null}

        {!countsTowardGoal(activity) ? (
          <Text style={s.note}>Already in your steps, so it's logged but doesn't add to a goal day.</Text>
        ) : null}

        <View style={s.guide}>
          <Text style={s.guideTitle}>Not sure how hard it was?</Text>
          {GUIDE.map((g) => (
            <Text key={g.effort} style={s.guideLine}>
              <Text style={s.guideLabel}>{EFFORT_LABEL[g.effort]}: </Text>
              {g.text}
            </Text>
          ))}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + space.md }]}>
        <Pressable style={s.save} onPress={save} accessibilityRole='button'>
          <Text style={s.saveText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { fontFamily: font.medium, fontSize: 16, color: colors.ink },
  rowTitle: { fontFamily: font.body, fontSize: 15, color: colors.ink },
  value: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink3, marginTop: 2 },
  block: {
    paddingHorizontal: space.lg,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.ink2, marginBottom: 8 },
  note: { fontFamily: font.body, fontSize: 12, color: colors.ink2, paddingHorizontal: space.lg, paddingTop: space.md },
  guide: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: 6 },
  guideTitle: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  guideLine: { fontFamily: font.body, fontSize: 12.5, lineHeight: 18, color: colors.ink2 },
  guideLabel: { fontFamily: font.semibold, color: colors.ink },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.sm, backgroundColor: colors.paper },
  save: { backgroundColor: colors.coral, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  saveText: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
});
