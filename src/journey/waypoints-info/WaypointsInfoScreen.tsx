import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PopupCard, popup } from '@shared/components/PopupCard/PopupCard';
import { gradients } from '@shared/theme';
import { useDayKey } from '@shared/hooks/useDayKey';
import { formatShortDate } from '@shared/utils/date';
import { useWaypoints } from '../../domain/waypoints/WaypointsContext';
import { useActivity } from '../../domain/activity/ActivityContext';
import { waypointStats } from './models/waypointStats';

/**
 * What the total and the day count on Journey mean, from tapping them: how waypoints are
 * earned, what counts as a day, why the streak can be longer than the days, and a little
 * about how it's going.
 */
export default function WaypointsInfoScreen() {
  const { waypoints, events } = useWaypoints();
  const { streak } = useActivity();
  const today = useDayKey();
  const stats = waypointStats(events, today);
  const dayWord = (n: number) => (n === 1 ? 'day' : 'days');

  return (
    <PopupCard colors={gradients.journey} journeyLink={false}>
      <Text style={popup.label}>Your waypoints</Text>
      <Text style={popup.big}>{waypoints.toLocaleString()}</Text>
      <Text style={popup.label}>
        {`earned on ${stats.days} ${dayWord(stats.days)}`}
      </Text>

      <View style={popup.section}>
        <Text style={popup.sectionTitle}>How it works</Text>
        <Text style={[popup.lineText, s.line]}>
          You earn waypoints for showing up: logging, moving, resting and
          hitting your goals.
        </Text>
        <Text style={[popup.lineText, s.line]}>
          A day counts once you earn at least one waypoint on it.
        </Text>
        {/* The streak reads the phone's step history; waypoints only come on days Tern is opened. */}
        {streak > stats.days ? (
          <Text style={[popup.lineText, s.line]}>
            {`Your ${streak}-day streak can be longer. It counts every day your phone recorded you reaching your goal, including days before Tern and days you didn't open it.`}
          </Text>
        ) : null}
      </View>

      {stats.best ? (
        <View style={popup.section}>
          <Text style={popup.sectionTitle}>So far</Text>
          <View style={popup.line}>
            <Text style={popup.lineText}>Last 7 days</Text>
            <Text style={[popup.lineText, popup.gold]}>
              {`+${stats.thisWeek.toLocaleString()}`}
            </Text>
          </View>
          <View style={popup.line}>
            <Text style={popup.lineText}>
              {`Best day · ${formatShortDate(stats.best.day)}`}
            </Text>
            <Text style={[popup.lineText, popup.gold]}>
              {`+${stats.best.points.toLocaleString()}`}
            </Text>
          </View>
        </View>
      ) : null}
    </PopupCard>
  );
}

const s = StyleSheet.create({
  line: { lineHeight: 18, paddingVertical: 3 },
});
