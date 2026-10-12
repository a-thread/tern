import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font } from '../../shared/theme';
import { Icon } from '../../shared/components/ui';
import { WeightTrend } from '../../shared/components/WeightTrend';
import { TrendRanges, TrendRange } from '../models/trendRange';
import { TrendCard, TrendHeader } from './TrendCard';
import { weightTrendFor } from '../models/weightTrend';
import type { TrendsStackParamList } from '../navigation';
import { useWeight } from '../../domain/weight/WeightContext';
import { signedChange } from '../../domain/weight/models/weightEntry';
import { useSettings } from '../../domain/settings/SettingsContext';
import { useUnits } from '../../domain/settings/hooks/useUnits';

/** The smoothed weight line for the range and how far it moved. Tapping opens the weight detail. */
export function WeightTrendCard({ range }: { range: TrendRange }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<TrendsStackParamList>>();
  const { settings } = useSettings();
  const { weightEntries, weightTrend } = useWeight();
  const { formatWeight, toDisplay, weightLabel } = useUnits();
  const rangeTrend = weightTrendFor(weightEntries, TrendRanges.DAYS[range]);
  const latest = weightTrend[weightTrend.length - 1];
  const delta =
    rangeTrend.length > 1
      ? rangeTrend[rangeTrend.length - 1] - rangeTrend[0]
      : 0;

  return (
    <TrendCard onPress={() => navigation.navigate('WeightDetail')}>
      {rangeTrend.length >= 2 ? (
        <>
          <TrendHeader
            title='Weight'
            value={formatWeight(latest)}
            sub={
              settings.weightGoalLb === null
                ? '7-day average'
                : `7-day average · ${Math.abs(toDisplay(latest - settings.weightGoalLb)).toFixed(1)} ${weightLabel} from goal`
            }
            delta={{
              text: signedChange(toDisplay(delta)),
              bg: colors.waterTint,
              color: colors.water,
            }}
          />
          <WeightTrend
            trend={rangeTrend.map(toDisplay)}
            spread={toDisplay(1.3)}
            goal={
              settings.weightGoalLb === null
                ? undefined
                : toDisplay(settings.weightGoalLb)
            }
          />
          <Text style={s.legendNote}>
            The shaded band is your day-to-day spread — normal fluctuation, not
            change.
          </Text>
        </>
      ) : (
        <View style={s.empty}>
          <Icon name='chart-bar' size={36} color={colors.dove} />
          <Text style={s.emptyTitle}>Not enough weigh-ins here yet</Text>
          <Text style={s.emptyBody}>
            {`A trend needs at least two weigh-ins in this range, and you have ${rangeTrend.length}.`}
            {weightEntries.length > rangeTrend.length
              ? ' Try a longer range.'
              : ' Tern can then draw a line that filters out daily noise.'}
          </Text>
        </View>
      )}
    </TrendCard>
  );
}

const s = StyleSheet.create({
  legendNote: {
    fontFamily: font.body,
    fontSize: 10.5,
    color: colors.ink3,
    marginTop: 6,
    lineHeight: 15,
  },
  empty: { alignItems: 'center', paddingVertical: 10 },
  emptyTitle: {
    fontFamily: font.display,
    fontSize: 16,
    color: colors.ink,
    marginTop: 10,
    marginBottom: 7,
  },
  emptyBody: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 18,
  },
});
