import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useDayKey } from '@shared/hooks/useDayKey';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { useAnimatedNumber } from '@shared/hooks/useAnimatedNumber';
import type { RootStackParamList } from '@shared/navigation/types';
import { useSettings } from '@settings/SettingsContext';
import { useWaypoints } from '@journey/WaypointsContext';
import { useLastSeenTotal } from '@journey/hooks/useLastSeenTotal';
import { earnedOn, legFor, legProgress, stillOpen } from '@journey/models/waypointSummary';
import { PopupCard, GOLD, popup } from '@journey/components/PopupCard';
import { FadeIn } from '@journey/components/FadeIn';

type Props = NativeStackScreenProps<RootStackParamList, 'Waypoints'>;

const COLORS = ['#1A2630', '#3E5A6C', '#8B7C6B'] as const;
/** When the count and the bar start, after the card has sprung in. */
const START_MS = 150;
const COUNT_MS = 900;
const LINE_STAGGER_MS = 60;

/**
 * The waypoints card, from the chip on Today: the total, what today earned, a couple of
 * things still open, and the leg of the route the bird is on. The total counts up and the
 * bar fills from where they stood the last time this was open.
 */
export default function WaypointsScreen({ route }: Props) {
  const { streak } = route.params;
  const { waypoints, events } = useWaypoints();
  const { settings } = useSettings();
  const today = useDayKey();
  const { lastSeen, remember } = useLastSeenTotal();

  // Remember the total on the way out, for next time.
  const latest = useRef(waypoints);
  latest.current = waypoints;
  useEffect(() => () => remember(latest.current), [remember]);

  const { lines, total: todayTotal } = earnedOn(events, today);
  const open = stillOpen(events, today, {
    mood: settings.trackMood,
    water: settings.trackWater,
    movement: settings.trackMovement,
  });
  // Where the count starts, fixed once read: the last total seen here, or (the first time)
  // the total before today's awards.
  const [start, setStart] = useState<number | null>(null);
  useEffect(() => {
    if (lastSeen === undefined || start !== null) return;
    setStart(Math.min(lastSeen ?? Math.max(waypoints - todayTotal, 0), waypoints));
  }, [lastSeen, start, waypoints, todayTotal]);

  return (
    <PopupCard colors={COLORS}>
      <Text style={popup.label}>Waypoints so far</Text>
      {start === null ? (
        <Text style={popup.big}>{waypoints.toLocaleString()}</Text>
      ) : (
        <CountTo from={start} to={waypoints} />
      )}
      <Text style={popup.label}>{streak > 0 ? `☀ ${streak}-day streak` : 'Every step counts'}</Text>

      {lines.length ? (
        <View style={popup.section}>
          <Text style={popup.sectionTitle}>
            Today · <Text style={popup.gold}>+{todayTotal}</Text>
          </Text>
          {lines.map((l, i) => (
            <FadeIn key={l.label} delay={START_MS + 50 + i * LINE_STAGGER_MS} style={popup.line}>
              <Text style={popup.lineText}>{l.label}</Text>
              <Text style={[popup.lineText, popup.gold]}>+{l.points}</Text>
            </FadeIn>
          ))}
        </View>
      ) : null}

      {open.length ? (
        <View style={popup.section}>
          <Text style={popup.sectionTitle}>Still open today</Text>
          <View style={s.pills}>
            {open.map((o) => (
              <Text key={o.label} style={s.pill}>{`${o.label} · +${o.points}`}</Text>
            ))}
          </View>
        </View>
      ) : null}

      {start === null ? null : <Leg events={events} from={start} to={waypoints} />}
    </PopupCard>
  );
}

/** The total, counting up from `from` to `to` once the card has sprung in. */
function CountTo({ from, to }: { from: number; to: number }) {
  const still = useReduceMotion();
  const [target, setTarget] = useState(still ? to : from);
  useEffect(() => {
    if (still) {
      setTarget(to);
      return;
    }
    const t = setTimeout(() => setTarget(to), START_MS);
    return () => clearTimeout(t);
  }, [to, still]);
  const shown = useAnimatedNumber(target, COUNT_MS);
  return <Text style={popup.big}>{shown.toLocaleString()}</Text>;
}

/** The next stop, and a bar that fills from where it stood last time (the paler part). */
function Leg({ events, from, to }: { events: Parameters<typeof legFor>[1]; from: number; to: number }) {
  const still = useReduceMotion();
  const leg = legFor(to, events);
  const was = legProgress(leg, from);
  const now = legProgress(leg, to);
  const fill = useRef(new Animated.Value(still ? now : was)).current;

  useEffect(() => {
    if (still) {
      fill.setValue(now);
      return;
    }
    const anim = Animated.timing(fill, {
      toValue: now,
      duration: COUNT_MS,
      delay: START_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [now, still, fill]);

  const gained = to - from;
  return (
    <View style={popup.section}>
      <Text style={popup.sectionTitle}>Next stop</Text>
      <View style={popup.line}>
        <Text style={popup.lineText}>{leg.next.name}</Text>
        <Text style={popup.soft}>{`${(leg.next.waypoints - to).toLocaleString()} to go`}</Text>
      </View>
      <View style={s.bar}>
        <View style={[s.barWas, { width: `${was * 100}%` }]} />
        <Animated.View
          style={[s.barNow, { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
      <Text style={popup.soft}>
        {gained > 0 ? (
          <>
            Since you last looked: <Text style={popup.gold}>+{gained.toLocaleString()}</Text>
          </>
        ) : (
          `${leg.fromName} → ${leg.next.name}`
        )}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 5,
  },
  barWas: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(242,200,136,0.35)' },
  barNow: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: GOLD, borderRadius: 3 },
});
