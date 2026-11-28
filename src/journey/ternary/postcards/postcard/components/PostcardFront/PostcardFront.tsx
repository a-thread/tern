import React from 'react';
import {
  ImageBackground,
  Linking,
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
  radius,
  space,
  typography,
} from '@shared/theme';
import { useToast } from '@shared/state/ToastContext';
import type { DestinationPhoto } from '@/journey/models/destinationPhotos';

/**
 * A postcard's picture side: the place's photo (or a warm sky where there's none) inside a
 * white border, with "Greetings from" across the top and the place's name at the bottom.
 */
export function PostcardFront({
  name,
  from,
  photo,
  width,
}: {
  name: string;
  /** "From Maya" or "You sent this". */
  from: string;
  photo: DestinationPhoto | null;
  width: number;
}) {
  const toast = useToast();
  const inner = width - Frame.PAD * 2;
  const words = (
    <>
      <LinearGradient
        colors={[colors.heroShadow, colors.heroShadowClear]}
        style={s.topShade}
      >
        <Text style={s.greetings}>Greetings from</Text>
      </LinearGradient>
      <LinearGradient
        colors={[colors.heroShadowClear, colors.heroShadow]}
        style={s.bottomShade}
      >
        <Text style={s.place}>{name}</Text>
      </LinearGradient>
    </>
  );

  const openCredit = (url: string) =>
    Linking.openURL(url).catch((e) => {
      console.warn('Could not open the photo page', e);
      toast.show("Couldn't open Wikimedia Commons.");
    });

  return (
    <View style={[s.card, { width }]}>
      {photo ? (
        <ImageBackground
          source={photo.source}
          style={[s.picture, { width: inner, height: inner * Frame.RATIO }]}
          resizeMode='cover'
          accessibilityIgnoresInvertColors
        >
          {words}
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={[...gradients.dawn]}
          style={[s.picture, { width: inner, height: inner * Frame.RATIO }]}
        >
          {words}
        </LinearGradient>
      )}
      <View style={s.foot}>
        {photo ? (
          <Pressable
            onPress={() => openCredit(photo.url)}
            hitSlop={6}
            accessibilityRole='link'
            accessibilityLabel={`Photo by ${photo.author}, ${photo.license}. Opens Wikimedia Commons`}
            style={s.creditTap}
          >
            <Text style={s.credit} numberOfLines={1}>
              {`Photo: ${photo.author} · ${photo.license}`}
            </Text>
          </Pressable>
        ) : (
          <View style={s.creditTap} />
        )}
        <Text style={s.from}>{from}</Text>
      </View>
    </View>
  );
}

/** The white border and the picture's shape, taller than wide like a portrait postcard. */
export class Frame {
  static readonly PAD = 10;
  static readonly RATIO = 1.3;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.onDark,
    borderRadius: radius.sm,
    padding: Frame.PAD,
    paddingBottom: space.sm,
  },
  picture: {
    justifyContent: 'space-between',
    borderRadius: 2,
    overflow: 'hidden',
  },
  topShade: { padding: space.lg, paddingBottom: space.xxl },
  bottomShade: { padding: space.lg, paddingTop: space.xxl },
  greetings: {
    fontFamily: font.displayItalic,
    fontSize: 28,
    color: colors.onDark,
  },
  place: {
    fontFamily: font.displayItalic,
    fontSize: 34,
    lineHeight: 38,
    color: colors.onDark,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.sm,
    paddingHorizontal: space.xs,
  },
  creditTap: { flex: 1 },
  credit: { ...typography.small, color: colors.ink3 },
  from: { ...typography.small, color: colors.ink2 },
});
