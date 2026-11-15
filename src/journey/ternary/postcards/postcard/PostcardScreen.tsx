import React, { useEffect } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  CARD_INNER_WIDTH,
  PopupCard,
  popup,
} from '@shared/components/PopupCard/PopupCard';
import { gradients, radius, space, typography } from '@shared/theme';
import { useToast } from '@shared/state/ToastContext';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { stopNamed } from '@/domain/ternary/models/stopover';
import type { RootStackParamList } from '@/navigation/types';
import { photoFor } from '@/journey/models/destinationPhotos';

type Props = NativeStackScreenProps<RootStackParamList, 'Postcard'>;

/** The photo's height over its width, like the stop cards on Journey. */
const PHOTO_RATIO = 0.62;

/**
 * One postcard, opened from the list: a photo of the place when there is one, who sent it,
 * and a few things about the stop. Never a date reached, a total or a pace.
 */
export default function PostcardScreen({ navigation, route }: Props) {
  const { ternary, ready } = useTernary();
  const toast = useToast();
  const card = ternary?.postcards.find((p) => p.id === route.params.id);
  const stop = card ? stopNamed(card.stopId) : undefined;

  // Gone once loaded (its sender left, or was blocked): nothing to show, so don't leave an
  // empty card in the way.
  useEffect(() => {
    if (ready && !stop) navigation.goBack();
  }, [ready, stop, navigation]);

  if (!card || !stop) return null;
  const photo = photoFor(stop.id);
  const from = card.yours ? 'You sent this' : `From ${card.fromName}`;

  const openCredit = (url: string) =>
    Linking.openURL(url).catch((e) => {
      console.warn('Could not open the photo page', e);
      toast.show("Couldn't open Wikimedia Commons.");
    });

  return (
    <PopupCard colors={gradients.journey} journeyLink={false}>
      {photo ? (
        <View style={s.photoWrap}>
          <Image
            source={photo.source}
            style={s.photo}
            resizeMode='cover'
            accessibilityIgnoresInvertColors
            accessible
            accessibilityLabel={`Photo of ${stop.name}`}
          />
          <Pressable
            onPress={() => openCredit(photo.url)}
            hitSlop={6}
            accessibilityRole='link'
            accessibilityLabel={`Photo by ${photo.author}, ${photo.license}. Opens Wikimedia Commons`}
          >
            <Text style={s.credit} numberOfLines={1}>
              {`Photo: ${photo.author} · ${photo.license}`}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={popup.label}>{from}</Text>
      <Text style={popup.title}>{`Greetings from ${stop.name}`}</Text>
      <Text style={[popup.lineText, s.note]}>{stop.note}</Text>

      <View style={popup.section}>
        <Text style={popup.sectionTitle}>About this stop</Text>
        {stop.facts.map((fact) => (
          <Text key={fact} style={[popup.lineText, s.fact]}>
            {`• ${fact}`}
          </Text>
        ))}
      </View>
    </PopupCard>
  );
}

const s = StyleSheet.create({
  // Starts below the card's ✕, so the close button never sits on the photo.
  photoWrap: {
    alignSelf: 'stretch',
    marginTop: space.lg,
    marginBottom: space.xs,
  },
  photo: {
    width: CARD_INNER_WIDTH,
    height: CARD_INNER_WIDTH * PHOTO_RATIO,
    borderRadius: radius.md,
  },
  credit: {
    ...typography.small,
    color: popup.soft.color,
    marginTop: space.xs,
    textAlign: 'right',
  },
  note: { lineHeight: 18, marginTop: space.xs },
  fact: { lineHeight: 18, paddingVertical: 3 },
});
