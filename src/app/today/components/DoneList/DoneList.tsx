import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, font } from '@/shared/theme';
import { FootNote, Group, GroupLabel, Row } from '@/shared/components/ui';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import { useMedication } from '@/domain/medication/MedicationContext';
import { useWater } from '@/domain/water/WaterContext';
import WaterSheet from '@/today/components/WaterSheet';
import { movementSummary } from '@/domain/movement/models/movementEntry';
import { scoreWord, MoodMetric } from '@/domain/mood/models/moodEntry';
import { formatLoggedAt } from '@/domain/weight/models/weightEntry';
import { useViewedDay } from '@/shared/state/ViewedDayContext';
import { dayWord } from '@/shared/utils/date';
import { useDayItems } from '@/today/hooks/useDayItems';
import { DoneBadge } from '@/today/components/DoneList/components/DoneBadge';
import { useRootNavigation } from '@/navigation/useAppNavigation';

/**
 * What has been done on the viewed day ("Today so far", "Yesterday", "Tuesday"), with a way
 * to undo or edit the ones that allow it. Before yesterday it's read-only, except that
 * "Meals logged" still opens that day in the Food tab.
 */
export function DoneList({
  quietWhenEmpty = false,
}: { quietWhenEmpty?: boolean } = {}) {
  const navigation = useRootNavigation();
  const {
    summary,
    mealsDone,
    waterDone,
    anythingDone,
    takenMedications,
    movementOnDay,
    movedToGoal,
    steps,
    day,
    isToday,
    editable,
  } = useDayItems();
  const { today } = useViewedDay();
  const { formatWeight, formatVolume } = useUnits();
  const { showCalories } = useFoodDisplay();
  const water = useWater();
  const { setTaken } = useMedication();
  const [waterOpen, setWaterOpen] = useState(false);
  const fromHealthConnect = movementOnDay.some(
    (e) => e.source === 'healthConnect',
  );

  // An older day with nothing on it says so; today and yesterday have "Left to do" above.
  if (!anythingDone)
    return editable || quietWhenEmpty ? null : (
      <FootNote>Nothing logged this day.</FootNote>
    );
  return (
    <>
      <GroupLabel>{isToday ? 'Today so far' : dayWord(day, today)}</GroupLabel>
      <Group>
        {mealsDone.length ? (
          <Row
            key='done-meals'
            title='Meals logged'
            sub={
              mealsDone.join(', ') +
              (showCalories && summary.meals
                ? ` · ${summary.meals.calories.toLocaleString()} cal`
                : '')
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
            chevron={editable}
            onPress={
              editable ? () => navigation.navigate('LogWeight') : undefined
            }
          />
        ) : null}
        {summary.checkIn ? (
          <Row
            key='done-check-in'
            title='Checked in'
            sub={`Mood ${summary.checkIn.mood} · ${scoreWord(MoodMetric.Mood, summary.checkIn.mood)} · Stress ${summary.checkIn.stress} · ${scoreWord(MoodMetric.Stress, summary.checkIn.stress)}`}
            icon={<DoneBadge />}
            chevron={editable}
            onPress={
              editable ? () => navigation.navigate('CheckIn') : undefined
            }
          />
        ) : null}
        {takenMedications.map((m) => (
          <Row
            key={`done-med-${m.id}`}
            title={`Took ${m.name}`}
            icon={<DoneBadge />}
            // Mirrors "Mark taken" in Left to do: the row is the action (today only).
            right={isToday ? <Text style={s.markText}>Undo</Text> : undefined}
            onPress={isToday ? () => setTaken(m.id, false) : undefined}
          />
        ))}
        {waterDone && summary.waterOz !== null ? (
          <Row
            key='done-water'
            title='Water'
            sub={`${formatVolume(summary.waterOz)} of ${formatVolume(water.goalOz)}`}
            icon={<DoneBadge />}
            chevron={editable}
            onPress={editable ? () => setWaterOpen(true) : undefined}
          />
        ) : null}
        {movementOnDay.length ? (
          <Row
            key='done-movement'
            title={`Moved ${movementSummary(movementOnDay)}`}
            sub={
              fromHealthConnect
                ? 'Includes workouts from Health Connect'
                : editable
                  ? 'Add more, or remove one'
                  : undefined
            }
            icon={<DoneBadge />}
            chevron={editable}
            onPress={
              editable
                ? () => navigation.navigate('LogMovement', { day })
                : undefined
            }
          />
        ) : null}
        {summary.stepGoalReached ? (
          <Row
            key='done-steps'
            title='Step goal reached'
            sub={
              movedToGoal
                ? `by movement · ${steps.toLocaleString()} steps`
                : `${steps.toLocaleString()} steps`
            }
            icon={<DoneBadge />}
            chevron
            onPress={() => navigation.navigate('Tabs', { screen: 'Trends' })}
          />
        ) : null}
      </Group>
      <WaterSheet visible={waterOpen} onClose={() => setWaterOpen(false)} />
    </>
  );
}

const s = StyleSheet.create({
  markText: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
});
