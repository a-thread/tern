import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  colors,
  font,
  gradients,
  postcardColors,
  radius,
  space,
  typography,
} from '@shared/theme';
import { stopNamed } from '@/domain/ternary/models/stopover';
import type { Postcard } from '@/domain/ternary/models/ternary';
import { useRootNavigation } from '@/navigation/useAppNavigation';
import { photoFor } from '@/journey/models/destinationPhotos';

/** Each card sits a little askew, the way postcards land on a table; the tilt repeats. */
class Tilt {
  static readonly DEGREES = [-2, 1.5, -1, 2] as const;
  static of(index: number): string {
    return `${Tilt.DEGREES[index % Tilt.DEGREES.length]}deg`;
  }
}

/**
 * One postcard in the list: its picture side, with "Greetings from" the place, who sent it in
 * handwriting, and nothing about when. Tapping it opens the postcard to turn over.
 */
export function PostcardCard({
  card,
  index,
}: {
  card: Postcard;
  /** Its place in the list, for the tilt. */
  index: number;
}) {
  const navigation = useRootNavigation();
  const stop = stopNamed(card.stopId);
  if (!stop) return null;
  const from = card.yours ? 'You sent this' : `From ${card.fromName}`;
  const photo = photoFor(stop.id);
  const words = (
    <View style={s.words}>
      <Text style={s.greetings}>Greetings from</Text>
      <Text style={s.place} numberOfLines={2}>
        {stop.name}
      </Text>
    </View>
  );

  return (
    <Pressable
      style={({ pressed }) => [
        s.card,
        { transform: [{ rotate: Tilt.of(index) }] },
        pressed && s.pressed,
      ]}
      onPress={() => navigation.navigate('Postcard', { id: card.id })}
      accessibilityRole='button'
      accessibilityLabel={`Postcard ${card.yours ? 'you sent' : `from ${card.fromName}`}: greetings from ${stop.name}`}
      accessibilityHint='Opens the postcard'
    >
      {photo ? (
        <ImageBackground
          source={photo.source}
          style={s.picture}
          imageStyle={s.image}
          resizeMode='cover'
          accessibilityIgnoresInvertColors
        >
          {/* A little shade under the words, so they read on any photo. */}
          <LinearGradient
            colors={[colors.heroShadowClear, colors.heroShadow]}
            style={s.shade}
          >
            {words}
          </LinearGradient>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={[...gradients.dawn]}
          style={[s.picture, s.image]}
        >
          <View style={s.shade}>{words}</View>
        </LinearGradient>
      )}
      <View style={s.foot}>
        <Text style={s.from} numberOfLines={1}>
          {from}
        </Text>
        <Text style={typography.small}>Tap to open</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: postcardColors.card,
    borderRadius: radius.sm,
    padding: space.sm,
    paddingBottom: space.xs,
    marginBottom: space.lg,
    marginHorizontal: space.xs,
    shadowColor: colors.ink,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pressed: { opacity: 0.85 },
  picture: { height: 132, justifyContent: 'flex-end' },
  image: { borderRadius: 3 },
  shade: { padding: space.md, borderRadius: 3 },
  words: { gap: 0 },
  greetings: {
    fontFamily: font.displayItalic,
    fontSize: 16,
    color: colors.onDark,
  },
  place: {
    fontFamily: font.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.onDark,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
    paddingTop: space.xs,
    gap: space.sm,
  },
  from: {
    flex: 1,
    fontFamily: font.hand,
    fontSize: 20,
    color: postcardColors.ink,
  },
});
