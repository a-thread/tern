import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@shared/theme';
import { FlockBadge } from '../../../components/FlockBadge/FlockBadge';

/** Three friends' birds overlapping, as they fly on the map. */
const LOOKS = [1, 4, 2];

class FlockSizes {
  /** Three of them, ringed and tucked, come to 66 points: `Feature`'s picture column. */
  static readonly BADGE = 26;
  /** How far each bird tucks under the one before it. */
  static readonly OVERLAP = 12;
  /** The card-coloured ring that keeps one bird apart from the next. */
  static readonly RING = 2;
}

/** A small flock of three friends' birds: "fly one bird together", as a picture. */
export function FlockPicture() {
  return (
    <View style={s.row} importantForAccessibility='no-hide-descendants'>
      {LOOKS.map((look, i) => (
        <View key={look} style={[s.ring, i > 0 && s.tucked]}>
          <FlockBadge look={look} size={FlockSizes.BADGE} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row' },
  ring: {
    borderRadius: FlockSizes.BADGE / 2 + FlockSizes.RING,
    borderWidth: FlockSizes.RING,
    borderColor: colors.card,
  },
  tucked: { marginLeft: -FlockSizes.OVERLAP },
});
