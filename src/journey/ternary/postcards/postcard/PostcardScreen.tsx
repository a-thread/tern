import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, postcardColors, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { useReduceMotion } from '@shared/hooks/useReduceMotion';
import { useTernary } from '@/domain/ternary/TernaryContext';
import { stopNamed } from '@/domain/ternary/models/stopover';
import { senderLook } from '@/domain/ternary/models/postcards';
import type { RootStackParamList } from '@/navigation/types';
import { photoFor } from '@/journey/models/destinationPhotos';
import { Frame, PostcardFront } from './components/PostcardFront/PostcardFront';
import { PostcardBack } from './components/PostcardBack/PostcardBack';

type Props = NativeStackScreenProps<RootStackParamList, 'Postcard'>;

/** The card's widest, its turn, and the room under the picture for the credit line. */
class Flip {
  static readonly MAX_WIDTH = 342;
  static readonly MS = 450;
  static readonly FOOT = 34;
}

/**
 * One postcard, opened from the list: its picture side first, and a tap turns it over to the
 * message side. Never a date reached, a total or a pace. Turned in place with Reduce Motion
 * on. Tapping outside the card, or ✕, closes it.
 */
export default function PostcardScreen({ navigation, route }: Props) {
  const { ternary, ready } = useTernary();
  const still = useReduceMotion();
  const window = useWindowDimensions();
  const turn = useRef(new Animated.Value(0)).current;
  const [back, setBack] = useState(false);
  const card = ternary?.postcards.find((p) => p.id === route.params.id);
  const stop = card ? stopNamed(card.stopId) : undefined;

  // Gone once loaded (its sender left, or was blocked): nothing to show, so don't leave an
  // empty card in the way.
  useEffect(() => {
    if (ready && !stop) navigation.goBack();
  }, [ready, stop, navigation]);

  if (!ternary || !card || !stop) return null;

  const width = Math.min(Flip.MAX_WIDTH, window.width - space.xl * 2);
  const height = (width - Frame.PAD * 2) * Frame.RATIO + Frame.PAD + Flip.FOOT;
  const signed = card.yours ? 'You' : card.fromName;

  const flip = () => {
    const to = back ? 0 : 1;
    setBack(!back);
    if (still) turn.setValue(to);
    else
      Animated.timing(turn, {
        toValue: to,
        duration: Flip.MS,
        useNativeDriver: true,
      }).start();
  };
  const face = (from: string, to: string) => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: turn.interpolate({
          inputRange: [0, 1],
          outputRange: [from, to],
        }),
      },
    ],
  });

  return (
    <Pressable
      style={s.overlay}
      onPress={() => navigation.goBack()}
      accessibilityLabel='Close the postcard'
    >
      <Pressable
        onPress={flip}
        style={{ width, height }}
        accessibilityRole='button'
        accessibilityLabel={
          back
            ? `Postcard from ${signed}, message side. ${stop.note}`
            : `Postcard from ${signed}: greetings from ${stop.name}`
        }
        accessibilityHint={
          back ? 'Turns it to the picture side' : 'Turns it over to read it'
        }
      >
        <Animated.View
          style={[s.face, face('0deg', '180deg')]}
          importantForAccessibility={back ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={back}
        >
          <PostcardFront
            name={stop.name}
            from={card.yours ? 'You sent this' : `From ${card.fromName}`}
            photo={photoFor(stop.id)}
            width={width}
          />
        </Animated.View>
        <Animated.View
          style={[s.face, face('180deg', '360deg')]}
          importantForAccessibility={back ? 'auto' : 'no-hide-descendants'}
          accessibilityElementsHidden={!back}
        >
          <PostcardBack
            place={stop.name}
            message={[stop.note, ...(stop.facts[0] ? [stop.facts[0]] : [])]}
            signed={signed}
            to={ternary.name}
            look={senderLook(ternary.members, card)}
            width={width}
            height={height}
          />
        </Animated.View>
      </Pressable>

      <View style={s.hint} pointerEvents='none'>
        <Icon name='rotate-3d-variant' size={16} color={colors.onDarkSoft} />
        <Text style={s.hintText}>
          {back
            ? 'Tap to see the picture side'
            : 'Tap the card to turn it over'}
        </Text>
      </View>

      <Pressable
        style={s.close}
        onPress={() => navigation.goBack()}
        hitSlop={8}
        accessibilityRole='button'
        accessibilityLabel='Close'
      >
        <Icon name='close' size={18} color={colors.onDark} />
      </Pressable>
    </Pressable>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: postcardColors.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
    shadowColor: colors.ink,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  hint: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  hintText: { ...typography.meta, color: colors.onDarkSoft },
  close: {
    position: 'absolute',
    top: 56,
    right: space.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chipOnDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
