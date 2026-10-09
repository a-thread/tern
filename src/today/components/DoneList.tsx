import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font } from '@shared/theme';
import { Group, GroupLabel, Row } from '@shared/components/ui';
import type { RootStackParamList } from '@shared/navigation/types';
import { useUnits } from '@settings/hooks/useUnits';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import { useMedication } from '@medication/MedicationContext';
import { useWater } from '@water/WaterContext';
import WaterSheet from '@water/components/WaterSheet';
import { MovementSheet } from '@movement/components/MovementSheet';
import { movementSummary } from '@movement/models/movementEntry';
import { scoreWord, MoodMetric } from '@mood/models/moodEntry';
import { formatLoggedAt } from '@weight/models/weightEntry';
import { useActivity } from '@today/ActivityContext';
import { useTodayItems } from '@today/hooks/useTodayItems';
import { DoneBadge } from './DoneBadge';

/** "Today so far": what has been done, with a way to undo or edit the ones that allow it. */
export function DoneList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { summary, mealsDone, waterDone, anythingDone, takenMedications, movementToday, movedToGoal } =
    useTodayItems();
  const { formatWeight, formatVolume } = useUnits();
  const { showCalories } = useFoodDisplay();
  const water = useWater();
  const { setTaken } = useMedication();
  const { todaySteps } = useActivity();
  const [waterOpen, setWaterOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const fromHealthConnect = movementToday.some((e) => e.source === 'healthConnect');

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
            chevron
            onPress={() => navigation.navigate('Tabs', { screen: 'Food' })}
          />
        ) : null}
        {summary.weighedIn ? (
          <Row
            key='done-weight'
            title='Weighed in'
            sub={`${formatWeight(summary.weighedIn.lb)}, ${formatLoggedAt(summary.weighedIn.loggedAt)}`}
            icon={<DoneBadge />}
            chevron
            onPress={() => navigation.navigate('LogWeight')}
          />
        ) : null}
        {summary.checkIn ? (
          <Row
            key='done-check-in'
            title='Checked in'
            sub={`Mood ${summary.checkIn.mood} · ${scoreWord(MoodMetric.Mood, summary.checkIn.mood)} · Stress ${summary.checkIn.stress} · ${scoreWord(MoodMetric.Stress, summary.checkIn.stress)}`}
            icon={<DoneBadge />}
            chevron
            onPress={() => navigation.navigate('CheckIn')}
          />
        ) : null}
        {takenMedications.map((m) => (
          <Row
            key={`done-med-${m.id}`}
            title={`Took ${m.name}`}
            icon={<DoneBadge />}
            // Mirrors "Mark taken" in Left to do: the row is the action.
            right={<Text style={s.markText}>Undo</Text>}
            onPress={() => setTaken(m.id, false)}
          />
        ))}
        {waterDone && summary.waterOz !== null ? (
          <Row
            key='done-water'
            title='Water'
            sub={`${formatVolume(summary.waterOz)} of ${formatVolume(water.goalOz)}`}
            icon={<DoneBadge />}
            chevron
            onPress={() => setWaterOpen(true)}
          />
        ) : null}
        {movementToday.length ? (
          <Row
            key='done-movement'
            title={`Moved ${movementSummary(movementToday)}`}
            sub={fromHealthConnect ? 'Includes workouts from Health Connect' : 'Add more, or remove one'}
            icon={<DoneBadge />}
            chevron
            onPress={() => setMovementOpen(true)}
          />
        ) : null}
        {summary.stepGoalReached ? (
          <Row
            key='done-steps'
            title={movedToGoal ? 'Goal day' : 'Step goal reached'}
            sub={
              movedToGoal
                ? `by movement · ${todaySteps.toLocaleString()} steps`
                : `${todaySteps.toLocaleString()} steps`
            }
            icon={<DoneBadge />}
            chevron
            onPress={() => navigation.navigate('Tabs', { screen: 'Trends' })}
          />
        ) : null}
      </Group>
      <WaterSheet visible={waterOpen} onClose={() => setWaterOpen(false)} />
      <MovementSheet visible={movementOpen} onClose={() => setMovementOpen(false)} />
    </>
  );
}

const s = StyleSheet.create({
  markText: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
});
