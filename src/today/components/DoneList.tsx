import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font } from '@shared/theme';
import { Group, GroupLabel, Row } from '@shared/components/ui';
import type { RootStackParamList } from '@shared/navigation/types';
import { useUnits } from '@settings/hooks/useUnits';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import { useMedication } from '@medication/MedicationContext';
import { useWater } from '@water/WaterContext';
import { scoreWord, MoodMetric } from '@mood/models/moodEntry';
import { formatLoggedAt } from '@weight/models/weightEntry';
import { useActivity } from '@today/ActivityContext';
import { useTodayItems } from '@today/hooks/useTodayItems';
import { DoneBadge } from './DoneBadge';

/** "Today so far": what has been done, with a way to undo or edit the ones that allow it. */
export function DoneList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { summary, mealsDone, waterDone, anythingDone, takenMedications } = useTodayItems();
  const { formatWeight, formatVolume } = useUnits();
  const { showCalories } = useFoodDisplay();
  const water = useWater();
  const { setTaken } = useMedication();
  const { todaySteps } = useActivity();

  if (!anythingDone) return null;
  return (
    <>
      <GroupLabel>Today so far</GroupLabel>
      <Group>
        {mealsDone.length ? (
          <Row
            key='done-meals'
            title='Meals logged'
            sub={
              mealsDone.join(', ') +
              (showCalories && summary.meals ? ` · ${summary.meals.calories.toLocaleString()} cal` : '')
            }
            icon={<DoneBadge />}
          />
        ) : null}
        {summary.weighedIn ? (
          <Row
            key='done-weight'
            title='Weighed in'
            sub={`${formatWeight(summary.weighedIn.lb)}, ${formatLoggedAt(summary.weighedIn.loggedAt)}`}
            icon={<DoneBadge />}
          />
        ) : null}
        {summary.checkIn ? (
          <Row
            key='done-check-in'
            title='Checked in'
            sub={`Mood ${summary.checkIn.mood} · ${scoreWord(MoodMetric.Mood, summary.checkIn.mood)} · Stress ${summary.checkIn.stress} · ${scoreWord(MoodMetric.Stress, summary.checkIn.stress)}`}
            icon={<DoneBadge />}
            right={
              <Pressable onPress={() => navigation.navigate('CheckIn')} hitSlop={8}>
                <Text style={s.markText}>Edit</Text>
              </Pressable>
            }
          />
        ) : null}
        {takenMedications.map((m) => (
          <Row
            key={`done-med-${m.id}`}
            title={`Took ${m.name}`}
            icon={<DoneBadge />}
            right={
              <Pressable onPress={() => setTaken(m.id, false)} hitSlop={8}>
                <Text style={s.markText}>Undo</Text>
              </Pressable>
            }
          />
        ))}
        {waterDone && summary.waterOz !== null ? (
          <Row
            key='done-water'
            title='Water'
            sub={`${formatVolume(summary.waterOz)} of ${formatVolume(water.goalOz)}`}
            icon={<DoneBadge />}
          />
        ) : null}
        {summary.stepGoalReached ? (
          <Row
            key='done-steps'
            title='Step goal reached'
            sub={`${todaySteps.toLocaleString()} steps`}
            icon={<DoneBadge />}
          />
        ) : null}
      </Group>
    </>
  );
}

const s = StyleSheet.create({
  markText: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
});
