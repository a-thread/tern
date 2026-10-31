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
import { formatShortDate } from '@shared/utils/date';
import { gradients, radius, space, typography } from '@shared/theme';
import { useToast } from '@shared/state/ToastContext';
import type { RootStackParamList } from '../../navigation/types';
import { useWaypoints } from '../../domain/waypoints/WaypointsContext';
import {
  Milestones,
  milestonesFor,
} from '../../domain/waypoints/models/milestone';
import { photoFor } from './models/destinationPhotos';

type Props = NativeStackScreenProps<RootStackParamList, 'Destination'>;

/** The photo's height over its width. */
const PHOTO_RATIO = 0.62;

/**
 * A stop already passed, from its row on Journey: a photo from there, when it was reached,
 * and a few things about the place. Still, unlike the card that celebrates reaching it.
 */
export default function DestinationScreen({ navigation, route }: Props) {
  const toast = useToast();
  const { waypoints, events, ready } = useWaypoints();
  const stop = milestonesFor(waypoints, events).find(
    (m) => m.waypoints === route.params.waypoints && m.reached,
  );

  // No longer reached once loaded (the total went down after a reload): nothing to show, so don't
  // leave an empty card in the way.
  useEffect(() => {
    if (ready && !stop) navigation.goBack();
  }, [ready, stop, navigation]);

  if (!stop) return null;
  const place = Milestones.STOPS.find((s) => stop.id === `${stop.lap}-${s.id}`);
  const photo = place ? photoFor(place.id) : null;

  const openCredit = (url: string) =>
    Linking.openURL(url).catch((e) => {
      console.warn('Could not open the photo page', e);
      toast.show("Couldn't open Wikimedia Commons.");
    });

  return (
    // Opened from Journey itself, so no link back to it.
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

      <Text style={popup.title}>{stop.name}</Text>
      <Text style={popup.label}>
        {[
          stop.reachedOn
            ? `Reached ${formatShortDate(stop.reachedOn)}`
            : 'Reached',
          stop.lap > 1 ? `Migration ${stop.lap}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>

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
  // A fixed size, edge to edge inside the card. A percentage width lets Android fall back to
  // the picture's own pixel size, which drew it far bigger than the card.
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
  fact: { lineHeight: 18, paddingVertical: 3 },
});
