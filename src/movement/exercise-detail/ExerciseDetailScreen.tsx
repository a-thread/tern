import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { PushHeader, SegmentedControl, Stepper } from '@shared/components/ui';
import { useUnits } from '../../domain/settings/hooks/useUnits';
import { useMovement } from '../../domain/movement/MovementContext';
import { ActivityGlyph } from '../components/ActivityGlyph';
import { MinutesRuler } from './components/MinutesRuler';
import { StepsRow } from './components/StepsRow/StepsRow';
import type { MovementStackParamList } from '../navigation';
import {
  ACTIVITY_INFO,
  countsTowardGoal,
  distanceFromDisplay,
  distanceToDisplay,
  distanceUnit,
  Effort,
  EFFORT_LABEL,
  formatDistance,
  MEASURE_LABEL,
  MovementLimits,
  MovementMeasure,
} from '../../domain/movement/models/movementEntry';

type Props = NativeStackScreenProps<MovementStackParamList, 'ExerciseDetail'>;

const EFFORTS = Object.values(Effort);
const MEASURES = Object.values(MovementMeasure);

/** In tenths of a mile or kilometer. */
const DISTANCE_STEP = 0.1;

const GUIDE: { effort: Effort; text: string }[] = [
  {
    effort: Effort.Easy,
    text: 'Breathing stays easy and you could hold a full conversation.',
  },
  {
    effort: Effort.Moderate,
    text: 'Breathing picks up, and talking takes some effort.',
  },
  {
    effort: Effort.Hard,
    text: "Breathing hard: a few words at a time is all you've got.",
  },
];

/** With `entryId`, edits that entry. */
export default function ExerciseDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activity, day, entryId } = route.params;
  const info = ACTIVITY_INFO[activity];
  const { add, update, entries } = useMovement();
  const { units } = useUnits();
  const editing = entryId ? entries.find((e) => e.id === entryId) : undefined;
  const [measure, setMeasure] = useState<MovementMeasure>(
    editing?.steps ? MovementMeasure.Steps : MovementMeasure.Minutes,
  );
  const bySteps = !!info.inSteps && measure === MovementMeasure.Steps;
  const [minutes, setMinutes] = useState<number>(
    editing?.minutes || MovementLimits.DEFAULT_MINUTES,
  );
  const [steps, setSteps] = useState<number>(
    editing?.steps ?? MovementLimits.DEFAULT_STEPS,
  );
  const [effort, setEffort] = useState<Effort>(
    editing?.effort ?? Effort.Moderate,
  );
  const [distanceM, setDistanceM] = useState<number>(editing?.distanceM ?? 0);

  const stepDistance = (dir: 1 | -1) => {
    const shown = Math.round(distanceToDisplay(distanceM, units) * 10) / 10;
    const next = Math.max(
      0,
      Math.round((shown + dir * DISTANCE_STEP) * 10) / 10,
    );
    setDistanceM(
      Math.min(distanceFromDisplay(next, units), MovementLimits.MAX_DISTANCE_M),
    );
  };

  const save = () => {
    const amount = {
      minutes,
      effort,
      distanceM: distanceM || null,
      steps: bySteps ? steps : null,
    };
    // A change goes back to the list it was opened from; a new entry closes the flow. An entry
    // opened to change that has since gone just goes back, rather than logging a copy.
    if (entryId) {
      if (!editing || update(editing.id, amount)) {
        navigation.goBack();
      }
      return;
    }
    if (add({ day, activity, ...amount })) {
      navigation.getParent()?.goBack();
    }
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Exercise'
        backLabel='Exercises'
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.row}>
          <Text style={s.name}>{info.label}</Text>
          <ActivityGlyph activity={activity} size={28} />
        </View>

        {info.inSteps ? (
          <View style={s.block}>
            <Text style={s.label}>Log it by</Text>
            <SegmentedControl
              options={MEASURES}
              value={measure}
              onChange={setMeasure}
              label={(m) => MEASURE_LABEL[m]}
            />
          </View>
        ) : null}

        {bySteps ? (
          <StepsRow value={steps} onChange={setSteps} />
        ) : (
          <>
            <View style={s.row}>
              <Text style={s.rowTitle}>Duration</Text>
              <Text style={s.value}>{`${minutes} min`}</Text>
            </View>
            <MinutesRuler value={minutes} onChange={setMinutes} />
          </>
        )}

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
              value={
                distanceM
                  ? formatDistance(distanceM, units)
                  : `— ${distanceUnit(units)}`
              }
              valueMinWidth={64}
              decrementLabel='Less distance'
              incrementLabel='More distance'
              onDecrement={() => stepDistance(-1)}
              onIncrement={() => stepDistance(1)}
            />
          </View>
        ) : null}

        {bySteps ? (
          <Text style={s.note}>
            Added to your steps for the day, for when your phone wasn't with
            you.
          </Text>
        ) : !countsTowardGoal(activity) ? (
          <Text style={s.note}>
            Already in your steps, so it's logged but doesn't add to a goal day.
          </Text>
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

      <View style={s.footer}>
        <Pressable style={s.save} onPress={save} accessibilityRole='button'>
          <Text style={s.saveText}>{editing ? 'Save changes' : 'Save'}</Text>
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
  sub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink3,
    marginTop: 2,
  },
  block: {
    paddingHorizontal: space.lg,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink2,
    marginBottom: 8,
  },
  note: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink2,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  guide: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: 6 },
  guideTitle: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  guideLine: {
    fontFamily: font.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.ink2,
  },
  guideLabel: { fontFamily: font.semibold, color: colors.ink },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    backgroundColor: colors.paper,
  },
  save: {
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { fontFamily: font.bold, fontSize: 15, color: colors.onAction },
});
