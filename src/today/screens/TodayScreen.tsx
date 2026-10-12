import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space } from '@shared/theme';
import { useReplayOnFocus } from '@shared/hooks/useReplayOnFocus';
import { usePullToRefresh } from '@shared/hooks/usePullToRefresh';
import { easeLayout } from '@shared/utils/easeLayout';
import { WaypointRules } from '@journey/models/waypoint';
import { useWaypoints } from '@journey/WaypointsContext';
import WaypointBurst from '@journey/components/WaypointBurst';
import { useActivity } from '@today/ActivityContext';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useFood } from '@food/FoodContext';
import { useSettings } from '@settings/SettingsContext';
import { useWeight } from '@weight/WeightContext';
import { useWater } from '@water/WaterContext';
import { useMood } from '@mood/MoodContext';
import { useMedication } from '@medication/MedicationContext';
import { useMovement } from '@movement/MovementContext';
import { useCelebrationPlayback } from '@today/hooks/useCelebrationPlayback';
import { useMilestoneReward } from '@today/hooks/useMilestoneReward';
import { TodayHeader } from '@today/components/TodayHeader';
import { StepsHero } from '@today/components/StepsHero';
import { RestScene } from '@today/components/RestScene';
import { useRestDay } from '@today/hooks/useRestDay';
import { WeekStrip } from '@today/components/WeekStrip';
import { LeftToDoList } from '@today/components/LeftToDoList';
import { DoneList } from '@today/components/DoneList';
import { FoodSummary } from '@food/components/FoodSummary';
import { TargetSuggestionCard } from '@food/components/TargetSuggestionCard';

/**
 * The Today tab: steps, the week, what is left to do and what is done, and the waypoint
 * celebrations. On a rest day the sky card and the to-do list give way to a calm scene; the
 * day's logging stays one tap away ("Log something anyway").
 */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { todaySteps, streak, refresh: refreshSteps } = useActivity();
  // Today unless a past day was tapped in the week strip; every section below follows it.
  const { day, isToday, editable } = useViewedDay();
  const rest = useRestDay();
  // "Log something anyway": the usual lists on a rest day, until the day or the rest changes.
  // Kept as the day and rest it was tapped for, so changing either puts the calm back at once.
  const revealKey = `${day}|${rest.isRest}`;
  const [revealedFor, setRevealedFor] = useState<string | null>(null);
  const reveal = revealedFor === revealKey;
  // Calm while resting, and through the take-off after undoing it: the usual lists wait until
  // the tern has gone, so the page changes once, not twice.
  const calm = (rest.isRest || rest.leaving) && !reveal;
  const { completeCelebration, reload: reloadWaypoints } = useWaypoints();
  const { foodLog, reload: reloadFood } = useFood();
  const { settings } = useSettings();
  const { reload: reloadWeight } = useWeight();
  const { reload: reloadWater } = useWater();
  const { reload: reloadMood } = useMood();
  const { reload: reloadMedication } = useMedication();
  const { reload: reloadMovement } = useMovement();
  // Everything Today shows: steps, the day's logs, and the waypoint total.
  const refreshControl = usePullToRefresh([
    refreshSteps,
    reloadFood,
    reloadWeight,
    reloadWater,
    reloadMood,
    reloadMedication,
    reloadMovement,
    reloadWaypoints,
  ]);
  const replayKey = useReplayOnFocus(todaySteps);
  // Each day picked flies the bird again from the start (both keys only ever count up).
  const [dayPicks, setDayPicks] = useState(0);
  useEffect(() => setDayPicks((n) => n + 1), [day]);
  const flightKey = replayKey + dayPicks;
  // The waypoints for resting wait for the tern to land.
  const { rootRef, heroRef, chipRef, playing, finish } = useCelebrationPlayback(
    rest.holdCelebrations,
  );
  useMilestoneReward(playing !== null);

  return (
    <View
      ref={rootRef}
      collapsable={false}
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <TodayHeader chipRef={chipRef} />

      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 100 }}
      >
        {rest.showScene ? (
          <RestScene
            heroRef={heroRef}
            entrance={rest.entrance}
            leaving={rest.leaving}
            onLeft={() => {
              easeLayout(); // the taller scene card gives way to the sky card
              rest.finishLeaving();
            }}
            onTouchdown={rest.markTouchedDown}
            title='Rest day'
            line={
              isToday
                ? 'Your streak is safe. Nothing to log today.'
                : 'A day off. Your streak carried on.'
            }
            detail={restDetail(rest.record?.steps ?? todaySteps, isToday ? streak : 0)}
            note={isToday ? 'Reminders are quiet until tomorrow' : undefined}
          />
        ) : (
          <StepsHero heroRef={heroRef} replayKey={flightKey} />
        )}
        <WeekStrip replayKey={replayKey} />
        {calm ? (
          <>
            {editable && !rest.leaving ? (
              <Pressable
                onPress={() => {
                  easeLayout();
                  setRevealedFor(revealKey);
                }}
                hitSlop={8}
                style={s.anyway}
                accessibilityRole='button'
              >
                <Text style={s.anywayText}>Log something anyway</Text>
              </Pressable>
            ) : null}
            <DoneList quietWhenEmpty />
            {foodLog.length > 0 && settings.trackCalories ? <FoodSummary /> : null}
          </>
        ) : (
          <>
            <LeftToDoList />
            <DoneList />
            {settings.trackCalories ? <FoodSummary /> : null}
            {isToday && !rest.isRest ? <TargetSuggestionCard /> : null}
          </>
        )}
      </ScrollView>

      {playing ? (
        <WaypointBurst
          key={playing.celebration.id}
          id={playing.celebration.id}
          points={playing.celebration.points}
          label={WaypointRules.ALL.find((r) => r.id === playing.celebration.source)?.label ?? ''}
          origin={playing.origin}
          target={playing.target}
          onArrive={() => completeCelebration(playing.celebration.id)}
          onDone={finish}
        />
      ) : null}
    </View>
  );
}

/** "2,310 steps · ☀ 9 days" under the rest day scene. */
function restDetail(steps: number, streak: number): string {
  const sun = streak > 0 ? ` · ☀ ${streak} ${streak === 1 ? 'day' : 'days'}` : '';
  return `${steps.toLocaleString()} steps${sun}`;
}

const s = StyleSheet.create({
  anyway: { alignSelf: 'center', paddingVertical: space.md },
  anywayText: { fontFamily: font.semibold, fontSize: 13, color: colors.coral },
});
