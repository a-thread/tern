import React, { useState } from 'react';

import { StepBars } from '../StepBars';
import { TrendCard, TrendFigure } from '../TrendCard';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useFocusLoad } from '../../hooks/useFocusLoad';
import { addDays } from '@shared/utils/date';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { averageDaily, bucketWater } from './models/waterBars';
import { totalsByDay } from '@/domain/water/models/waterEntry';
import { TrendRanges, TrendRange } from '../../models/trendRange';
import { useWater } from '@/domain/water/WaterContext';

/** Average water per day, and a bar per day (or week), for the Trends range. */
export default function WaterTrendCard({
  range,
  refreshKey = 0,
}: {
  range: TrendRange;
  /** Bump to read the history again (pull to refresh). */
  refreshKey?: number;
}) {
  const { settings } = useSettings();
  const { formatVolume } = useUnits();
  const { totalOz, loadRange } = useWater(); // totalOz is a trigger: reload after logging a drink
  const today = useDayKey();
  const [byDay, setByDay] = useState<Record<string, number>>({});

  useFocusLoad(
    () => loadRange(addDays(today, -(TrendRanges.DAYS[range] - 1)), today),
    (entries) => setByDay(totalsByDay(entries)),
    [loadRange, today, range, totalOz, refreshKey],
    'Could not load water history',
  );

  const average = averageDaily(byDay, today, TrendRanges.DAYS[range]);
  const bars = bucketWater(byDay, settings.waterGoalOz, range, today);

  return (
    <TrendCard title='Water'>
      <TrendFigure
        value={average === null ? '—' : formatVolume(average)}
        sub={
          average === null
            ? 'no water logged yet'
            : `daily average ${TrendRanges.LABEL[range]} · goal ${formatVolume(settings.waterGoalOz)}`
        }
      />
      <StepBars
        days={bars}
        goal={settings.waterGoalOz}
        showLegend={false}
        showLabels={range !== TrendRange.Month}
      />
    </TrendCard>
  );
}
