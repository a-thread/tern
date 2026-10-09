import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TernMark from '@shared/components/TernMark';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import type { RootStackParamList } from '@shared/navigation/types';
import { useWaypoints } from '@journey/WaypointsContext';
import { latestMilestone, Milestones } from '@journey/models/milestone';
import { daysWithWaypoints } from '@journey/models/waypoint';
import { legFor, routeFraction } from '@journey/models/waypointSummary';
import WaypointBurst from '@journey/components/WaypointBurst';
import { RouteStrip } from '@journey/components/RouteStrip';
import { FadeIn } from '@journey/components/FadeIn';
import { CARD_WIDTH, GOLD, PopupCard, popup } from '@journey/components/PopupCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Milestone'>;

const COLORS = ['#2A2440', '#4A4372', '#4E8C7D'] as const;
const MARK = 64;
/** The mark's centre on the card (its top padding plus half the mark), where the feathers burst. */
const MARK_CENTRE = { x: CARD_WIDTH / 2, y: 22 + MARK / 2 };

/** The moment, in ms: feathers and mark, then the flight, then the words once the bird lands. */
class Timing {
  static readonly BURST = 100;
  static readonly FLIGHT = 600;
  static readonly NAME = 1900;
  static readonly STORY = 2300;
}

/**
 * Passing a stop on the migration: the same feathers as an award burst from the tern mark,
 * the bird flies the leg it just finished, and then the place's name and a line about it
 * appear. Shown once per stop (see `useMilestoneReward`).
 */
export default function MilestoneScreen({ route }: Props) {
  const still = useReduceMotion();
  const { waypoints, events } = useWaypoints();
  const stop = latestMilestone(route.params.waypoints);
  const [burst, setBurst] = useState(false);
  const markScale = useRef(new Animated.Value(still ? 1 : 0.3)).current;

  useEffect(() => {
    if (still) return;
    const t = setTimeout(() => setBurst(true), Timing.BURST);
    Animated.spring(markScale, { toValue: 1, friction: 5, tension: 90, delay: Timing.BURST, useNativeDriver: true }).start();
    return () => clearTimeout(t);
  }, [still, markScale]);

  if (!stop) return null;
  const index = Milestones.STOPS.findIndex((s) => stop.id.endsWith(`-${s.id}`));
  const to = routeFraction(stop.waypoints);
  const from = index > 0 ? Milestones.STOPS[index - 1].waypoints / Milestones.MIGRATION_LENGTH : 0;
  const next = legFor(Math.max(waypoints, stop.waypoints), events).next;
  const days = daysWithWaypoints(events);

  return (
    <PopupCard
      colors={COLORS}
      overlay={
        burst ? (
          <WaypointBurst
            id={stop.waypoints}
            origin={MARK_CENTRE}
            target={MARK_CENTRE}
            onArrive={() => {}}
            onDone={() => setBurst(false)}
          />
        ) : null
      }
    >
      <Animated.View style={{ transform: [{ scale: markScale }] }}>
        <TernMark size={MARK} color={GOLD} />
      </Animated.View>

      <FadeIn delay={Timing.NAME} style={{ alignItems: 'center', marginTop: 6 }}>
        <Text style={popup.label}>
          {stop.lap > 1 ? `Milestone reached · Migration ${stop.lap}` : 'Milestone reached'}
        </Text>
        <Text style={popup.title}>{stop.name}</Text>
        <Text style={popup.label}>
          {`${stop.waypoints.toLocaleString()} waypoints${days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'} of showing up` : ''}`}
        </Text>
      </FadeIn>

      <RouteStrip from={from} to={to} delay={Timing.FLIGHT} />

      <FadeIn delay={Timing.STORY} style={{ alignItems: 'center', alignSelf: 'stretch' }}>
        <Text style={[popup.lineText, { textAlign: 'center', marginTop: 10, lineHeight: 19, fontStyle: 'italic' }]}>
          {stop.note}
        </Text>
        <View style={[popup.section, { alignItems: 'center' }]}>
          <Text style={popup.sectionTitle}>Next stop</Text>
          <Text style={popup.lineText}>
            {`${next.name} · ${Math.max(next.waypoints - waypoints, 0).toLocaleString()} to go`}
          </Text>
        </View>
      </FadeIn>
    </PopupCard>
  );
}
