import React from 'react';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, typography } from '@shared/theme';
import { TrendRanges, TrendRange } from '../models/trendRange';
import { TrendCard, TrendHeader } from './TrendCard';
import { StepBars } from './StepBars';
import { useActivity } from '../../domain/activity/ActivityContext';
import { useSettings } from '../../domain/settings/SettingsContext';
import { noStepsNote } from '../models/noStepsNote';
import { bucketSteps } from '../models/stepBars';
import { summarizeSteps } from '../models/stepsSummary';
import type { TrendsStackParamList } from '../navigation';

/** Average steps for the range with the change since the range before, and a bar per day (or week). */
export function StepsTrendCard({ range }: { range: TrendRange }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<TrendsStackParamList>>();
  const { settings } = useSettings();
  const { days, status, stepsReadable } = useActivity();
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
      {stepsReadable ? (
        <StepBars
          days={bars}
          goal={settings.stepGoal}
          showLabels={range !== TrendRange.Month}
        />
      ) : (
        <Text style={typography.small}>
          {noStepsNote(status, settings.healthData.readSteps)}
        </Text>
      )}
    </TrendCard>
  );
}
