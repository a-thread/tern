import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, gradients, radius, space, typography } from '@shared/theme';
import { stopNamed } from '@/domain/ternary/models/stopover';
import type { Postcard } from '@/domain/ternary/models/ternary';
import { useRootNavigation } from '@/navigation/useAppNavigation';
import { photoFor } from '@/journey/models/destinationPhotos';

/**
 * One postcard in the list: the place (its photo when there is one), who sent it, and a fact
 * about the stop. No date, total or pace. Tapping it opens the whole postcard.
 */
export function PostcardCard({ card }: { card: Postcard }) {
  const navigation = useRootNavigation();
  const stop = stopNamed(card.stopId);
  if (!stop) return null;
  const fact = stop.facts[0] ?? stop.note;
  const from = card.yours ? 'you' : card.fromName;
  const photo = photoFor(stop.id);
  const place = <Text style={s.place}>{stop.name}</Text>;

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.pressed]}
      onPress={() => navigation.navigate('Postcard', { id: card.id })}
      accessibilityRole='button'
      accessibilityLabel={`Postcard from ${from}: greetings from ${stop.name}. ${fact}`}
      accessibilityHint='Opens the postcard'
    >
      {photo ? (
        <ImageBackground
          source={photo.source}
          style={s.picture}
          resizeMode='cover'
          accessibilityIgnoresInvertColors
        >
          {/* A little shade under the name, so it reads on any photo. */}
          <LinearGradient
            colors={[colors.heroShadowClear, colors.heroShadow]}
            style={s.shade}
          >
            {place}
          </LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient colors={[...gradients.dawn]} style={s.picture}>
          {place}
        </LinearGradient>
      )}
      <View style={s.body}>
        <Text style={typography.label}>
          {card.yours ? 'You sent' : `From ${card.fromName}`}
        </Text>
        <Text style={typography.heading}>{`Greetings from ${stop.name}`}</Text>
        <Text style={s.fact} numberOfLines={2}>
          {fact}
        </Text>
      </View>
    </Pressable>
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
  pressed: { opacity: 0.85 },
  picture: { height: 96, justifyContent: 'flex-end' },
  shade: { padding: space.md },
  place: { ...typography.heading, color: colors.onDark, padding: space.md },
  body: { padding: space.md, gap: space.xs },
  fact: { ...typography.meta, lineHeight: 18 },
});
