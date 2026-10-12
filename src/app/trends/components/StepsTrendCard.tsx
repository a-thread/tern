import React from 'react';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, typography } from '../../shared/theme';
import { TrendRanges, TrendRange } from '../models/trendRange';
import { TrendCard, TrendHeader } from './TrendCard';
import { StepBars } from './StepBars';
import { useActivity } from '../../domain/activity/ActivityContext';
import { useSettings } from '../../domain/settings/SettingsContext';
import { StepsStatus } from '../../domain/activity/steps.repository';
import { bucketSteps } from '../models/stepBars';
import { summarizeSteps } from '../models/stepsSummary';
import type { TrendsStackParamList } from '../navigation';

/** Average steps for the range with the change since the range before, and a bar per day (or week). */
export function StepsTrendCard({ range }: { range: TrendRange }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<TrendsStackParamList>>();
  const { settings } = useSettings();
  const { days, status } = useActivity();
  const rangeSteps = summarizeSteps(days, TrendRanges.DAYS[range]);
  const bars = bucketSteps(days, range);
  const { changePct } = rangeSteps;

  return (
    <TrendCard onPress={() => navigation.navigate('StepsDetail')}>
      <TrendHeader
        title='Steps'
        value={
          rangeSteps.average === null
            ? '—'
            : rangeSteps.average.toLocaleString()
        }
        sub={`daily average ${TrendRanges.LABEL[range]}`}
        delta={
          changePct === null
            ? null
            : {
                text: `${changePct > 0 ? '+' : changePct < 0 ? '−' : ''}${Math.abs(changePct)}%`,
                bg: colors.glacierTint,
                color: colors.glacierDeep,
              }
        }
      />
      {status === StepsStatus.Connected ? (
        <StepBars
          days={bars}
          goal={settings.stepGoal}
          showLabels={range !== TrendRange.Month}
        />
      ) : (
        <Text style={typography.small}>
          Connect step data in Settings → Health data to see this.
        </Text>
      )}
    </TrendCard>
  );
}
