import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, gradients, space, typography } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { TRAIL_PALETTE } from '@shared/models/trailPalette';
import { useSettings } from '@/domain/settings/SettingsContext';
import {
  type TrailColor,
  TrailColors,
} from '@/domain/settings/models/trailColor';

/**
 * One trail colour to pick, drawn as a stroke on a scrap of Journey's night sky, with a
 * tick when it's the one chosen.
 */
export function TrailChoice({ trail }: { trail: TrailColor }) {
  const { settings, updateSettings } = useSettings();
  const chosen = settings.trailColor === trail;
  const name = TrailColors.NAMES[trail];
  return (
    <Pressable
      style={s.row}
      onPress={() => updateSettings({ trailColor: trail })}
      accessibilityRole='radio'
      accessibilityState={{ checked: chosen }}
      accessibilityLabel={`${name} trail`}
    >
      <View style={s.sky}>
        <View style={[s.stroke, { backgroundColor: TRAIL_PALETTE[trail] }]} />
      </View>
      <Text style={[typography.rowTitle, s.name]}>{name}</Text>
      {chosen ? <Icon name='check' size={18} color={colors.aurora} /> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    minHeight: 48,
  },
  sky: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: gradients.journey[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stroke: { width: 16, height: 3, borderRadius: 2, transform: [{ rotate: '-30deg' }] },
  name: { flex: 1 },
});
