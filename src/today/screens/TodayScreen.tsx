import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@shared/theme';
import { useReplayOnFocus } from '@shared/hooks/useReplayOnFocus';
import { WaypointRules } from '@journey/models/waypoint';
import { useWaypoints } from '@journey/WaypointsContext';
import WaypointBurst from '@journey/components/WaypointBurst';
import { useActivity } from '@today/ActivityContext';
import { useCelebrationPlayback } from '@today/hooks/useCelebrationPlayback';
import { useMilestoneReward } from '@today/hooks/useMilestoneReward';
import { TodayHeader } from '@today/components/TodayHeader';
import { StepsHero } from '@today/components/StepsHero';
import { WeekStrip } from '@today/components/WeekStrip';
import { LeftToDoList } from '@today/components/LeftToDoList';
import { DoneList } from '@today/components/DoneList';
import { NutritionCard } from '@today/components/NutritionCard';

/** The Today tab: steps, the week, what is left to do and what is done, and the waypoint celebrations. */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { todaySteps } = useActivity();
  const { completeCelebration } = useWaypoints();
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

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 100 }}>
        <StepsHero heroRef={heroRef} replayKey={replayKey} />
        <WeekStrip replayKey={replayKey} />
        <LeftToDoList />
        <DoneList />
        <NutritionCard />
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
