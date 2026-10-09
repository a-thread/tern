import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@shared/theme';
import { useReplayOnFocus } from '@shared/hooks/useReplayOnFocus';
import { usePullToRefresh } from '@shared/hooks/usePullToRefresh';
import { WaypointRules } from '@journey/models/waypoint';
import { useWaypoints } from '@journey/WaypointsContext';
import WaypointBurst from '@journey/components/WaypointBurst';
import { useActivity } from '@today/ActivityContext';
import { useViewedDay } from '@shared/state/ViewedDayContext';
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
import { TargetSuggestionCard } from '@food/components/TargetSuggestionCard';

/** The Today tab: steps, the week, what is left to do and what is done, and the waypoint celebrations. */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { todaySteps, refresh: refreshSteps } = useActivity();
  // Today unless a past day was tapped in the week strip; every section below follows it.
  const { day, isToday } = useViewedDay();
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
  // Each day picked flies the bird again from the start (both keys only ever count up).
  const [dayPicks, setDayPicks] = useState(0);
  useEffect(() => setDayPicks((n) => n + 1), [day]);
  const flightKey = replayKey + dayPicks;
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
        <StepsHero heroRef={heroRef} replayKey={flightKey} />
        <WeekStrip replayKey={replayKey} />
        <LeftToDoList />
        <DoneList />
        <NutritionCard />
        {isToday ? <TargetSuggestionCard /> : null}
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
