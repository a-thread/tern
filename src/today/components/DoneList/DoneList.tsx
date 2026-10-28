import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, font } from '@shared/theme';
import {
  FootNote,
  Group,
  GroupLabel,
  Icon,
  IconBadge,
  Row,
} from '@shared/components/ui';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import { useMedication } from '@/domain/medication/MedicationContext';
import { useWater } from '@/domain/water/WaterContext';
import { useWeight } from '@/domain/weight/WeightContext';
import { useOpenWaterSheet } from '../../hooks/useWaterSheet';
import {
  movementSummary,
  isFromHealthApp,
} from '@/domain/movement/models/movementEntry';
import { scoreWord, MoodMetric } from '@/domain/mood/models/moodEntry';
import { formatLoggedAt } from '@/domain/weight/models/weightEntry';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { dayWord } from '@shared/utils/date';
import { healthAppName } from '@shared/utils/healthApp';
import { useDayItems } from '../../hooks/useDayItems';
import { useActivity } from '@/domain/activity/ActivityContext';
import { DoneBadge } from './components/DoneBadge';
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
    weighInSkipped,
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
  const { stepsReadable } = useActivity();
  const { formatWeight, formatVolume } = useUnits();
  const { showCalories } = useFoodDisplay();
  const water = useWater();
  const { setTaken } = useMedication();
  const { setWeighInSkipped } = useWeight();
  const openWaterSheet = useOpenWaterSheet();
  const fromHealthApp = movementOnDay.some((e) => isFromHealthApp(e.source));

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
        {weighInSkipped && !summary.weighedIn ? (
          <Row
            key='done-weight-skipped'
            title='Skipped weigh-in'
            icon={<DoneBadge />}
            // Mirrors "Skip" on the Log weight screen: the row is the action, and it puts the weigh-in back.
            right={editable ? <Text style={s.markText}>Undo</Text> : undefined}
            onPress={editable ? () => setWeighInSkipped(day, false) : undefined}
          />
        ) : null}
        {summary.checkIn ? (
          <Row
            key='done-check-in'
            title='Mood check-in'
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
            // A past day lists whatever was drunk; the tick is only for a goal that was met.
            icon={
              water.reached ? (
                <DoneBadge />
              ) : (
                <IconBadge bg={colors.waterTint}>
                  <Icon name='water-outline' size={16} color={colors.water} />
                </IconBadge>
              )
            }
            chevron={editable}
            onPress={editable ? openWaterSheet : undefined}
          />
        ) : null}
        {movementOnDay.length ? (
          <Row
            key='done-movement'
            title={`Moved ${movementSummary(movementOnDay)}`}
            sub={
              fromHealthApp
                ? `Includes workouts from ${healthAppName()}`
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
            title={movedToGoal ? 'Movement goal reached' : 'Step goal reached'}
            sub={stepsReadable ? `${steps.toLocaleString()} steps` : undefined}
            icon={<DoneBadge />}
            chevron
            onPress={() => navigation.navigate('Tabs', { screen: 'Trends' })}
          />
        ) : null}
      </Group>
    </>
  );
}

const s = StyleSheet.create({
  markText: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
});
