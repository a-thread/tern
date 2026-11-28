import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { font, postcardColors, radius, space } from '@shared/theme';
import { Stamp } from './components/Stamp/Stamp';
import { PostmarkStamp } from './components/PostmarkStamp/PostmarkStamp';

/**
 * A postcard's message side: the stop's note and a fact about it in handwriting, signed by
 * the sender; their own tern as the stamp; a postmark with the place and no date; and the
 * ternary as the address.
 */
export function PostcardBack({
  place,
  message,
  signed,
  to,
  look,
  width,
  height,
}: {
  place: string;
  /** What's written: the stop's note, and a fact about it. */
  message: string[];
  /** "Maya", or "You" for a postcard you sent. */
  signed: string;
  /** The ternary's name. */
  to: string;
  /** The sender's look in the flock, for the stamp. */
  look: number;
  width: number;
  height: number;
}) {
  return (
    <View style={[s.card, { width, height }]}>
      <View style={s.top}>
        <Text style={s.heading}>Post card</Text>
        <View style={s.marks}>
          <PostmarkStamp place={place} />
          <Stamp look={look} />
        </View>
      </View>

      <View style={s.halves}>
        <View style={s.message}>
          {message.map((line) => (
            <Text key={line} style={s.hand}>
              {line}
            </Text>
          ))}
          <Text style={[s.hand, s.signed]}>{`– ${signed}`}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.address}>
          <Text style={[s.hand, s.rule]} numberOfLines={2}>{`To: ${to}`}</Text>
          <View style={[s.rule, s.blank]} />
          <View style={[s.rule, s.blank]} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: postcardColors.card,
    borderRadius: radius.sm,
    padding: space.lg,
    gap: space.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heading: {
    fontFamily: font.display,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: postcardColors.heading,
    paddingTop: space.xs,
  },
  marks: { flexDirection: 'row', alignItems: 'flex-start' },
  halves: { flex: 1, flexDirection: 'row', gap: space.md },
  message: { flex: 1.25, gap: space.sm },
  hand: {
    fontFamily: font.hand,
    fontSize: 19,
    lineHeight: 22,
    color: postcardColors.ink,
  },
  signed: { marginTop: 'auto', fontSize: 24, lineHeight: 28 },
  divider: { width: 1.5, backgroundColor: postcardColors.rule },
  address: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: space.md,
    paddingBottom: space.xs,
  },
  rule: {
    borderBottomWidth: 1.5,
    borderBottomColor: postcardColors.rule,
    paddingBottom: 2,
  },
  blank: { height: 22 },
});
