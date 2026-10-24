import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@shared/theme';
import { useCelebrationPlayback } from './hooks/useCelebrationPlayback';
import { useMilestoneReward } from './hooks/useMilestoneReward';
import { useTodayRefresh } from './hooks/useTodayRefresh';
import { useRestDay } from './hooks/useRestDay';
import { useRestReveal } from './hooks/useRestReveal';
import { useFlightKey } from './hooks/useFlightKey';
import { useWaterSheet, WaterSheetContext } from './hooks/useWaterSheet';
import { TodayHeader } from './components/TodayHeader';
import { StepsHero } from './components/StepsHero/StepsHero';
import { RestDayHero } from './components/RestDayHero';
import { WeekStrip } from './components/WeekStrip/WeekStrip';
import { RestDayLists } from './components/RestDayLists';
import { DayLists } from './components/DayLists';
import { CelebrationBurst } from './components/CelebrationBurst';
import WaterSheet from './components/WaterSheet';

/**
 * The Today tab: steps, the week, what is left to do and what is done, and the waypoint
 * celebrations. On a rest day the sky card and the to-do list give way to a calm scene; the
 * day's logging stays one tap away ("Log something anyway"). Every section follows the viewed
 * day: today, unless a past day was tapped in the week strip.
 */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const refreshControl = useTodayRefresh();
  const rest = useRestDay();
  const { calm, reveal } = useRestReveal(rest.isRest, rest.leaving);
  const { replayKey, flightKey } = useFlightKey();

  const waterSheet = useWaterSheet();

  // The waypoints for resting wait for the tern to land, and every award waits for the
  // water sheet to close: nothing may open over its modal.
  const { rootRef, heroRef, chipRef, playing, finish } = useCelebrationPlayback(
    rest.holdCelebrations || waterSheet.showing,
  );
  useMilestoneReward(playing !== null || waterSheet.showing);

  return (
    <WaterSheetContext.Provider value={waterSheet.open}>
      <View
        ref={rootRef}
        collapsable={false}
        style={[s.root, { paddingTop: insets.top }]}
      >
        <TodayHeader chipRef={chipRef} />

        <ScrollView
          refreshControl={refreshControl}
          contentContainerStyle={s.content}
        >
          {rest.showScene ? (
            <RestDayHero heroRef={heroRef} rest={rest} />
          ) : (
            <StepsHero heroRef={heroRef} replayKey={flightKey} />
          )}
          <WeekStrip replayKey={replayKey} />
          {calm ? (
            <RestDayLists onReveal={reveal} leaving={rest.leaving} />
          ) : (
            <DayLists resting={rest.isRest} />
          )}
        </ScrollView>

        {playing ? (
          <CelebrationBurst playing={playing} onDone={finish} />
        ) : null}
      </View>
      <WaterSheet
        visible={waterSheet.visible}
        onClose={waterSheet.close}
        onHidden={waterSheet.hidden}
      />
    </WaterSheetContext.Provider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
});
