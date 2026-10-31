import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PopupCard, popup } from '@shared/components/PopupCard/PopupCard';
import { gradients } from '@shared/theme';
import { useActivity } from '../../domain/activity/ActivityContext';
import { useMovement } from '../../domain/movement/MovementContext';
import { StreakFreezes } from '../../domain/activity/models/dayRecord';
import { streakRules } from './models/streakRules';

/**
 * What the ☀ streak and ❄ freeze chips on Today mean, from either chip: how many of each are
 * held now, how a streak grows, and how freezes are earned, held and spent.
 */
export default function StreakScreen() {
  const { streak, freezes } = useActivity();
  const movement = useMovement();
  const rules = streakRules({ movement: movement.enabled });

  return (
    <PopupCard colors={gradients.waypoints} journeyLink={false}>
      <Text style={popup.label}>Your streak</Text>
      <Text style={popup.big}>
        {streak > 0
          ? `☀ ${streak} ${streak === 1 ? 'day' : 'days'}`
          : 'Not started yet'}
      </Text>
      <Text style={popup.label}>
        {`❄ ${freezes} of ${StreakFreezes.MAX} freezes`}
      </Text>

      <View style={popup.section}>
        <Text style={popup.sectionTitle}>☀ Streak</Text>
        {rules.streak.map((line) => (
          <Text key={line} style={[popup.lineText, s.line]}>
            {line}
          </Text>
        ))}
      </View>

      <View style={popup.section}>
        <Text style={popup.sectionTitle}>❄ Freezes</Text>
        {rules.freezes.map((line) => (
          <Text key={line} style={[popup.lineText, s.line]}>
            {line}
          </Text>
        ))}
      </View>
    </PopupCard>
  );
}

const s = StyleSheet.create({
  line: { lineHeight: 18, paddingVertical: 3 },
});
