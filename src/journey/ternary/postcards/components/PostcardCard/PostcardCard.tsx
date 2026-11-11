import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients, radius, space, typography } from '@shared/theme';
import { stopNamed } from '@/domain/ternary/models/stopover';
import type { Postcard } from '@/domain/ternary/models/ternary';

/** One postcard: the place, who sent it, and a fact about the stop. No date, total or pace. */
export function PostcardCard({ card }: { card: Postcard }) {
  const stop = stopNamed(card.stopId);
  if (!stop) return null;
  const fact = stop.facts[0] ?? stop.note;
  const from = card.yours ? 'you' : card.fromName;
  return (
    <View
      style={s.card}
      accessible
      accessibilityLabel={`Postcard from ${from}: greetings from ${stop.name}. ${fact}`}
    >
      <LinearGradient colors={[...gradients.dawn]} style={s.picture}>
        <Text style={s.place}>{stop.name}</Text>
      </LinearGradient>
      <View style={s.body}>
        <Text style={typography.label}>
          {card.yours ? 'You sent' : `From ${card.fromName}`}
        </Text>
        <Text style={typography.heading}>{`Greetings from ${stop.name}`}</Text>
        <Text style={s.fact}>{fact}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: space.md,
  },
  picture: { height: 96, justifyContent: 'flex-end', padding: space.md },
  place: { ...typography.heading, color: colors.onDark },
  body: { padding: space.md, gap: space.xs },
  fact: { ...typography.meta, lineHeight: 18 },
});
