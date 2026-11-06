import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { PopupCard, popup } from '@shared/components/PopupCard/PopupCard';
import { gradients } from '@shared/theme';
import { useToast } from '@shared/state/ToastContext';
import {
  MigrationPhase,
  MigrationRoute,
} from '../../domain/waypoints/models/migrationRoute';

const km = (n: number) => `${n.toLocaleString()} km`;

/**
 * Where the route on Journey comes from, from the info button by "Stops": the tracking
 * studies it follows, how far each part of the trip is, and how far a waypoint goes.
 */
export default function RouteInfoScreen() {
  const toast = useToast();
  const { PHASE_KM, KM_PER_WAYPOINT, SOURCES, STOPS } = MigrationRoute;
  const total = STOPS[STOPS.length - 1].km;

  const open = (url: string) =>
    Linking.openURL(url).catch((e) => {
      console.warn('Could not open the paper', e);
      toast.show("Couldn't open the paper.");
    });

  return (
    <PopupCard colors={gradients.journey} journeyLink={false}>
      <Text style={popup.title}>A real tern's route</Text>
      <Text style={popup.label}>{`${STOPS.length} stops · ${km(total)}`}</Text>

      <View style={popup.section}>
        <Text style={popup.sectionTitle}>Where it comes from</Text>
        <Text style={[popup.lineText, s.line]}>
          In 2007, scientists fitted tiny trackers to Arctic terns nesting in
          northeast Greenland and followed them for a whole year. Your tern
          flies the route they took.
        </Text>
        <Text style={[popup.lineText, s.line]}>
          {`Each part of the trip is as long as the tracked birds flew it on average: ${km(PHASE_KM[MigrationPhase.South])} south, ${km(PHASE_KM[MigrationPhase.Winter])} along the Antarctic ice through the southern summer, and ${km(PHASE_KM[MigrationPhase.North])} home.`}
        </Text>
        <Text style={[popup.lineText, s.line]}>
          {`Each waypoint carries your tern ${KM_PER_WAYPOINT} km, so a typical day of showing up gets round in about a year, as the bird does.`}
        </Text>
        <Text style={[popup.lineText, s.line]}>
          The stops are real places on or beside the tracked routes. The terns
          fly past most of them without landing.
        </Text>
      </View>

      <View style={popup.section}>
        <Text style={popup.sectionTitle}>Sources</Text>
        {SOURCES.map((source) => (
          <Pressable
            key={source.url}
            onPress={() => open(source.url)}
            hitSlop={6}
            accessibilityRole='link'
            accessibilityLabel={`${source.cite}: ${source.title}. Opens the paper`}
          >
            <Text style={[popup.lineText, s.line]}>
              <Text style={s.cite}>{source.cite}</Text>
              {` · ${source.title}`}
            </Text>
          </Pressable>
        ))}
      </View>
    </PopupCard>
  );
}

const s = StyleSheet.create({
  line: { lineHeight: 18, paddingVertical: 3 },
  cite: { ...popup.gold, textDecorationLine: 'underline' },
});
