import React from 'react';
import { Text } from 'react-native';

import { colors, typography } from '@/shared/theme';
import { Card, GroupLabel, Icon } from '@/shared/components/ui';
import { TrendRanges, TrendRange } from '@/trends/models/trendRange';
import { ConsistencyGrid } from '@/trends/components/ConsistencyGrid/ConsistencyGrid';
import { Insight } from '@/trends/components/Insight/Insight';
import { longestProtectedRun } from '@/trends/models/stepsSummary';
import { useActivity } from '@/domain/activity/ActivityContext';

/** A grid of the range's days by how each went, with the longest stretch kept up. */
export function ConsistencyCard({ range }: { range: TrendRange }) {
  const { days } = useActivity();
  const states = days.slice(-TrendRanges.DAYS[range]).map((d) => d.state);
  const longestRun = longestProtectedRun(states);

  return (
    <>
      <GroupLabel>Consistency</GroupLabel>
      <Card>
        <Text style={typography.small}>
          {range === TrendRange.SixMonths ? 'Last 6 months' : `Last ${TrendRanges.DAYS[range]} days`}
        </Text>
        <ConsistencyGrid days={states} />
      </Card>

      {longestRun > 1 ? (
        <Insight icon={<Icon name='trending-up' size={15} color={colors.aurora} />}>
          {`Your longest stretch in this period is ${longestRun} days, rest days included.`}
        </Insight>
      ) : null}
    </>
  );
}
