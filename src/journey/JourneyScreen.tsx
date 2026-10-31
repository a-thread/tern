import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space, gradients, typography } from '@shared/theme';
import {
  Group,
  GroupLabel,
  Row,
  IconBadge,
  Card,
  ProgressBar,
  Icon,
} from '@shared/components/ui';
import { useRootNavigation } from '../navigation/useAppNavigation';
import { JourneyMap } from './components/JourneyMap/JourneyMap';
import { useReplayOnFocus } from '@shared/hooks/useReplayOnFocus';
import { usePullToRefresh } from '@shared/hooks/usePullToRefresh';
import { AnimatedNumber } from '@shared/components/AnimatedNumber/AnimatedNumber';
import {
  TabHeader,
  TabHeaderTone,
} from '@shared/components/TabHeader/TabHeader';
import { formatShortDate, monthName } from '@shared/utils/date';
import {
  daysWithWaypoints,
  WaypointSource,
} from '../domain/waypoints/models/waypoint';
import { earnableRules } from './models/earnableRules';
import { useActivity } from '../domain/activity/ActivityContext';
import {
  migrationProgress,
  milestonesFor,
} from '../domain/waypoints/models/milestone';
import { useSettings } from '../domain/settings/SettingsContext';
import { useWaypoints } from '../domain/waypoints/WaypointsContext';

const MILESTONE_COLORS = [colors.glacier, colors.violet, colors.aurora];

/** The badge colors for each way of earning, matching the feature it comes from. */
const RULE_STYLE: Record<WaypointSource, { bg: string; fg: string }> = {
  [WaypointSource.Steps]: { bg: colors.glacierTint, fg: colors.glacierDeep },
  [WaypointSource.Meals]: { bg: colors.kelpTint, fg: colors.kelp },
  [WaypointSource.Breakfast]: { bg: colors.kelpTint, fg: colors.kelp },
  [WaypointSource.Lunch]: { bg: colors.kelpTint, fg: colors.kelp },
  [WaypointSource.Dinner]: { bg: colors.kelpTint, fg: colors.kelp },
  [WaypointSource.Water]: { bg: colors.waterTint, fg: colors.water },
  [WaypointSource.Weight]: { bg: colors.waterTint, fg: colors.water },
  [WaypointSource.Mood]: { bg: colors.violetTint, fg: colors.violet },
  [WaypointSource.Medication]: { bg: colors.coralTint, fg: colors.coral },
  [WaypointSource.Rest]: { bg: colors.driftwoodTint, fg: colors.driftwood },
  [WaypointSource.Streak]: { bg: colors.sunTint, fg: colors.sunDeep },
  [WaypointSource.Movement]: { bg: colors.glacierTint, fg: colors.glacierDeep },
};

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useRootNavigation();
  const { waypoints, events, reload } = useWaypoints();
  const refreshControl = usePullToRefresh([reload]);
  const { settings } = useSettings();
  const { goalReachable } = useActivity();

  // Redraw the route when Journey comes into view the first time, when the total changes or after a minute away.
  const replayKey = useReplayOnFocus(waypoints);
  const milestones = useMemo(
    () => milestonesFor(waypoints, events),
    [waypoints, events],
  );
  const reached = milestones.filter((m) => m.reached);
  const next = milestones.find((m) => !m.reached);
  const prev = reached[reached.length - 1];

  const spanStart = prev?.waypoints ?? 0;
  const spanEnd = next?.waypoints ?? waypoints;
  const progress = (waypoints - spanStart) / Math.max(spanEnd - spanStart, 1);
  const migration = migrationProgress(waypoints);
  const firstDay = events.length
    ? events.reduce((a, e) => (e.day < a ? e.day : a), events[0].day)
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <LinearGradient
        colors={[...gradients.journey]}
        style={[s.hero, { paddingTop: insets.top + 8 }]}
      >
        <TabHeader
          eyebrow={
            migration.lap > 1
              ? `Migration ${migration.lap}`
              : firstDay
                ? `Since ${monthName(firstDay)}`
                : 'Your route'
          }
          title='Journey'
          tone={TabHeaderTone.OnDark}
          // The hero already pads the sides and the top.
          style={s.heroHeader}
        />

        <View style={{ marginTop: space.sm }}>
          <JourneyMap
            progress={migration.progress}
            lap={migration.lap}
            replayKey={replayKey}
          />
        </View>

        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <AnimatedNumber
            value={waypoints}
            duration={900}
            style={s.heroNumber}
          />
          <Text style={s.heroLabel}>
            waypoints · {daysWithWaypoints(events)}{' '}
            {daysWithWaypoints(events) === 1 ? 'day' : 'days'} earned
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: space.lg,
        }}
      >
        {next ? (
          <>
            <GroupLabel>Next milestone</GroupLabel>
            <Card>
              <View style={s.nextTop}>
                <Text style={s.nextName}>{next.name}</Text>
                <Text style={s.nextCount}>
                  {waypoints.toLocaleString()} /{' '}
                  {next.waypoints.toLocaleString()}
                </Text>
              </View>
              <View style={{ marginTop: 7 }}>
                <ProgressBar value={progress} color={colors.aurora} />
              </View>
              <Text style={s.nextSub}>
                {Math.max(next.waypoints - waypoints, 0).toLocaleString()} to go
              </Text>
            </Card>
          </>
        ) : null}

        {/* Where the bird is headed comes first, then the stops passed, newest first. */}
        <GroupLabel>Stops</GroupLabel>
        <Group>
          {[
            ...(next
              ? [
                  <Row
                    key={next.id}
                    title={next.name}
                    sub={`Next · ${next.waypoints.toLocaleString()}`}
                    icon={
                      <View style={[s.msDot, s.msPending]}>
                        <Text style={s.msPendingText}>—</Text>
                      </View>
                    }
                  />,
                ]
              : []),
            ...[...reached].reverse().map((m, i) => (
              <Row
                key={m.id}
                title={m.name}
                sub={[
                  m.lap > 1 ? `Migration ${m.lap}` : null,
                  m.waypoints.toLocaleString(),
                  m.reachedOn ? formatShortDate(m.reachedOn) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                onPress={() =>
                  navigation.navigate('Destination', {
                    waypoints: m.waypoints,
                  })
                }
                icon={
                  <View
                    style={[
                      s.msDot,
                      {
                        backgroundColor:
                          MILESTONE_COLORS[
                            (reached.length - 1 - i) % MILESTONE_COLORS.length
                          ],
                      },
                    ]}
                  >
                    <Icon name='check-bold' size={14} color='#fff' />
                  </View>
                }
              />
            )),
          ]}
        </Group>

        <GroupLabel>How waypoints are earned</GroupLabel>
        <Group>
          {earnableRules({
            food: settings.trackFood,
            mood: settings.trackMood,
            water: settings.trackWater,
            movement: settings.trackMovement,
            weight: settings.trackWeight,
            medication: settings.medications.length > 0,
            goal: goalReachable,
            rest: settings.restDaysPerWeek > 0,
          }).map((rule) => (
            <Row
              key={rule.id}
              title={rule.label}
              icon={
                <IconBadge bg={RULE_STYLE[rule.id].bg}>
                  <Text
                    style={[s.rulePoints, { color: RULE_STYLE[rule.id].fg }]}
                  >
                    {rule.points}
                    {rule.id === WaypointSource.Streak ? '+' : ''}
                  </Text>
                </IconBadge>
              }
            />
          ))}
        </Group>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  heroHeader: { paddingHorizontal: 0, paddingBottom: 0 },
  heroNumber: {
    fontFamily: font.displayMedium,
    fontSize: 34,
    color: '#F4F1F8',
    lineHeight: 38,
  },
  heroLabel: {
    fontFamily: font.body,
    fontSize: 11,
    color: '#BDB4D6',
    marginTop: 3,
  },
  nextTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  nextName: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  nextCount: typography.caption,
  nextSub: { ...typography.caption, marginTop: 7 },
  msDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msPending: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.dove,
    borderStyle: 'dashed',
  },
  msPendingText: { color: colors.ink3, fontSize: 11, fontFamily: font.bold },
  rulePoints: { fontFamily: font.bold, fontSize: typography.small.fontSize },
});
