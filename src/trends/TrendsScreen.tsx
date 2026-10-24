import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@shared/theme';
import { TabHeader } from '@shared/components/TabHeader/TabHeader';
import { FootNote, SegmentedControl } from '@shared/components/ui';
import { useDayKey } from '@shared/hooks/useDayKey';
import { monthName } from '@shared/utils/date';
import { TrendRanges, TrendRange } from './models/trendRange';
import { StepsTrendCard } from './components/StepsTrendCard';
import { WeightTrendCard } from './components/WeightTrendCard';
import { CaloriesTrendCard } from './components/CaloriesTrendCard/CaloriesTrendCard';
import { EnergyTrendCard } from './components/EnergyTrendCard';
import { MovementTrendCard } from './components/MovementTrendCard/MovementTrendCard';
import WaterTrendCard from './components/WaterTrendCard/WaterTrendCard';
import MoodTrendCard from './components/MoodTrendCard';
import { ConsistencyCard } from './components/ConsistencyCard';
import { useSettings } from '../domain/settings/SettingsContext';
import { useTrendsRefresh } from './hooks/useTrendsRefresh';

/** The Trends tab: a range picker over one card per thing being tracked. */
export default function TrendsScreen() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TrendRange>(TrendRange.Month);
  const { settings } = useSettings();
  const todayKey = useDayKey();
  const { refreshControl, refreshKey } = useTrendsRefresh();

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <TabHeader eyebrow={monthName(todayKey)} title='Trends' />

      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: space.lg,
        }}
      >
        <SegmentedControl
          options={TrendRanges.ALL}
          value={range}
          onChange={setRange}
          style={s.seg}
        />

        <StepsTrendCard range={range} />
        {/* weight: gone when weight isn't tracked */}
        {settings.trackWeight ? <WeightTrendCard range={range} /> : null}
        {/* nutrition: gone when neither calories nor macros are tracked */}
        {settings.trackCalories || settings.trackMacros ? (
          <CaloriesTrendCard range={range} refreshKey={refreshKey} />
        ) : null}
        {settings.adaptTarget &&
        settings.trackCalories &&
        settings.trackWeight ? (
          <EnergyTrendCard refreshKey={refreshKey} />
        ) : null}
        {settings.trackMovement ? (
          <MovementTrendCard range={range} refreshKey={refreshKey} />
        ) : null}
        {settings.trackWater ? (
          <WaterTrendCard range={range} refreshKey={refreshKey} />
        ) : null}
        {settings.trackMood ? <MoodTrendCard range={range} /> : null}

        <ConsistencyCard range={range} />

        <FootNote>
          Averages smooth out day-to-day noise. Single-day weight changes are
          mostly water and rarely meaningful.
        </FootNote>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  seg: {
    marginVertical: space.md,
  },
});
