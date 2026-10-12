import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space, typography } from '@/shared/theme';
import { FootNote, SegmentedControl } from '@/shared/components/ui';
import { useDayKey } from '@/shared/hooks/useDayKey';
import { monthName } from '@/shared/utils/date';
import { TrendRanges, TrendRange } from '@/trends/models/trendRange';
import { StepsTrendCard } from '@/trends/components/StepsTrendCard/StepsTrendCard';
import { WeightTrendCard } from '@/trends/components/WeightTrendCard/WeightTrendCard';
import { CaloriesTrendCard } from '@/trends/components/CaloriesTrendCard/CaloriesTrendCard';
import { EnergyTrendCard } from '@/trends/components/EnergyTrendCard/EnergyTrendCard';
import { MovementTrendCard } from '@/trends/components/MovementTrendCard/MovementTrendCard';
import WaterTrendCard from '@/trends/components/WaterTrendCard/WaterTrendCard';
import MoodTrendCard from '@/trends/components/MoodTrendCard/MoodTrendCard';
import { ConsistencyCard } from '@/trends/components/ConsistencyCard/ConsistencyCard';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useTrendsRefresh } from '@/trends/hooks/useTrendsRefresh';

/** The Trends tab: a range picker over one card per thing being tracked. */
export default function TrendsScreen() {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<TrendRange>(TrendRange.Month);
  const { settings } = useSettings();
  const todayKey = useDayKey();
  const { refreshControl, refreshKey } = useTrendsRefresh();

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Text style={s.eyebrow}>{monthName(todayKey)}</Text>
        <Text style={s.title}>Trends</Text>
      </View>

      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 100 }}
      >
        <SegmentedControl options={TrendRanges.ALL} value={range} onChange={setRange} style={s.seg} />

        <StepsTrendCard range={range} />
        {/* weight: gone when weight isn't tracked */}
        {settings.trackWeight ? <WeightTrendCard range={range} /> : null}
        {/* nutrition: part of "Track calories & macros", so gone when that is off */}
        {settings.trackCalories ? <CaloriesTrendCard range={range} refreshKey={refreshKey} /> : null}
        {settings.adaptTarget && settings.trackCalories && settings.trackWeight ? (
          <EnergyTrendCard refreshKey={refreshKey} />
        ) : null}
        {settings.trackMovement ? <MovementTrendCard range={range} refreshKey={refreshKey} /> : null}
        {settings.trackWater ? <WaterTrendCard range={range} refreshKey={refreshKey} /> : null}
        {settings.trackMood ? <MoodTrendCard range={range} /> : null}

        <ConsistencyCard range={range} />

        <FootNote>
          Averages smooth out day-to-day noise. Single-day weight changes are mostly water and rarely
          meaningful.
        </FootNote>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrow: typography.meta,
  title: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  seg: {
    marginVertical: space.md,
  },
});
