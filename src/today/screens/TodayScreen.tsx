import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@shared/theme';
import { useReplayOnFocus } from '@shared/hooks/useReplayOnFocus';
import { usePullToRefresh } from '@shared/hooks/usePullToRefresh';
import { WaypointRules } from '@journey/models/waypoint';
import { useWaypoints } from '@journey/WaypointsContext';
import WaypointBurst from '@journey/components/WaypointBurst';
import { useActivity } from '@today/ActivityContext';
import { useFood } from '@food/FoodContext';
import { useWeight } from '@weight/WeightContext';
import { useWater } from '@water/WaterContext';
import { useMood } from '@mood/MoodContext';
import { useMedication } from '@medication/MedicationContext';
import { useMovement } from '@movement/MovementContext';
import { useCelebrationPlayback } from '@today/hooks/useCelebrationPlayback';
import { useMilestoneReward } from '@today/hooks/useMilestoneReward';
import { TodayHeader } from '@today/components/TodayHeader';
import { StepsHero } from '@today/components/StepsHero';
import { WeekStrip } from '@today/components/WeekStrip';
import { LeftToDoList } from '@today/components/LeftToDoList';
import { DoneList } from '@today/components/DoneList';
import { NutritionCard } from '@today/components/NutritionCard';
import { DayLog } from '@today/components/DayLog';
import { TargetSuggestionCard } from '@food/components/TargetSuggestionCard';

/** The Today tab: steps, the week, what is left to do and what is done, and the waypoint celebrations. */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { todaySteps, week, refresh: refreshSteps } = useActivity();
  // Today unless a past day this week was tapped; a stale pick (new week) falls back to today.
  const [picked, setPicked] = useState<string | null>(null);
  const selected =
    week.find((d) => d.day === picked && !d.future) ??
    week.find((d) => d.isToday) ??
    week[week.length - 1];
  const { completeCelebration, reload: reloadWaypoints } = useWaypoints();
  const { reload: reloadFood } = useFood();
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
  const { rootRef, heroRef, chipRef, playing, finish } = useCelebrationPlayback();
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
        <StepsHero heroRef={heroRef} replayKey={replayKey} />
        <WeekStrip
          replayKey={replayKey}
          selectedDay={selected.day}
          onSelect={setPicked}
        />
        {selected.isToday ? (
          <>
            <LeftToDoList />
            <DoneList />
            <NutritionCard />
            <TargetSuggestionCard />
          </>
        ) : (
          <DayLog record={selected} />
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
