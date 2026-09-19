import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space, gradients } from '@shared/theme';
import {
  Group,
  GroupLabel,
  Row,
  IconBadge,
  Card,
  ProgressBar,
  FootNote,
} from '@shared/components/ui';
import { JourneyRoute } from '@shared/components/charts';
import { useAnimatedNumber } from '@shared/hooks/useAnimatedNumber';
import { milestones } from './mock';
import { waypointRules } from './models';
import { useWaypoints } from './WaypointsContext';

const MILESTONE_COLORS = [colors.glacier, colors.violet, colors.aurora];

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const { waypoints } = useWaypoints();
  const animatedWaypoints = useAnimatedNumber(waypoints, 900);
  const reached = milestones.filter((m) => m.reachedOn);
  const next = milestones.find((m) => !m.reachedOn);
  const prev = reached[reached.length - 1];

  const spanStart = prev?.waypoints ?? 0;
  const spanEnd = next?.waypoints ?? waypoints;
  const progress = (waypoints - spanStart) / Math.max(spanEnd - spanStart, 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <LinearGradient
        colors={[...gradients.journey]}
        style={[s.hero, { paddingTop: insets.top + 8 }]}
      >
        <Text style={s.heroEyebrow}>Since March</Text>
        <Text style={s.heroTitle}>Journey</Text>

        <View style={{ marginTop: space.sm }}>
          <JourneyRoute progress={0.75} />
        </View>

        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <Text style={s.heroNumber}>{animatedWaypoints.toLocaleString()}</Text>
          <Text style={s.heroLabel}>waypoints · 184 days logged</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 100,
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

        <GroupLabel>Reached</GroupLabel>
        <Group>
          {[
            ...[...reached].reverse().map((m, i) => (
              <Row
                key={m.id}
                title={m.name}
                sub={`${m.waypoints.toLocaleString()} · ${m.reachedOn}`}
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
                    <Text style={s.msCheck}>✓</Text>
                  </View>
                }
              />
            )),
            ...(next
              ? [
                  <Row
                    key={next.id}
                    title={next.name}
                    sub={next.waypoints.toLocaleString()}
                    icon={
                      <View style={[s.msDot, s.msPending]}>
                        <Text style={s.msPendingText}>—</Text>
                      </View>
                    }
                  />,
                ]
              : []),
          ]}
        </Group>

        <GroupLabel>How waypoints are earned</GroupLabel>
        <Group>
          {waypointRules.map((rule) => (
            <Row
              key={rule.id}
              title={rule.label}
              icon={
                <IconBadge
                  bg={
                    rule.id === 'steps'
                      ? colors.glacierTint
                      : rule.id === 'meals'
                        ? colors.kelpTint
                        : colors.driftwoodTint
                  }
                >
                  <Text
                    style={[
                      s.rulePoints,
                      {
                        color:
                          rule.id === 'steps'
                            ? colors.glacierDeep
                            : rule.id === 'meals'
                              ? colors.kelp
                              : colors.driftwood,
                      },
                    ]}
                  >
                    {rule.points}
                  </Text>
                </IconBadge>
              }
            />
          ))}
        </Group>

        <FootNote>
          Waypoints are earned for showing up — logging, moving, and resting.
          Never for weight or calorie totals.
        </FootNote>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  heroEyebrow: { fontFamily: font.body, fontSize: 11.5, color: '#BDB4D6' },
  heroTitle: {
    fontFamily: font.display,
    fontSize: 28,
    color: '#F4F1F8',
    letterSpacing: -0.3,
  },
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
  nextCount: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
  nextSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 7,
  },
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
  msCheck: { color: '#fff', fontSize: 11, fontFamily: font.bold },
  msPendingText: { color: colors.ink3, fontSize: 11, fontFamily: font.bold },
  rulePoints: { fontFamily: font.bold, fontSize: 10 },
});
