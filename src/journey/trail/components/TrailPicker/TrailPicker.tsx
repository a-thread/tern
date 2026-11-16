import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { popup } from '@shared/components/PopupCard/PopupCard';
import { colors, radius, space } from '@shared/theme';
import { Icon } from '@shared/components/ui';
import { TRAIL_PALETTE } from '@shared/models/trailPalette';
import { useSettings } from '@/domain/settings/SettingsContext';
import { TrailColors } from '@/domain/settings/models/trailColor';

/**
 * The four trail colors, one under another so each name fits: a stroke on the night sky,
 * with a ring and a tick on the one chosen.
 */
export function TrailPicker() {
  const { settings, updateSettings } = useSettings();

  return (
    <View style={s.list} accessibilityRole='radiogroup'>
      {TrailColors.ALL.map((trail) => {
        const chosen = settings.trailColor === trail;
        const name = TrailColors.NAMES[trail];
        return (
          <Pressable
            key={trail}
            style={[s.choice, chosen && s.chosen]}
            onPress={() => updateSettings({ trailColor: trail })}
            accessibilityRole='radio'
            accessibilityState={{ checked: chosen }}
            accessibilityLabel={`${name} trail`}
          >
            <View
              style={[s.stroke, { backgroundColor: TRAIL_PALETTE[trail] }]}
            />
            <Text style={[popup.lineText, s.name]}>{name}</Text>
            {chosen ? (
              <Icon name='check' size={18} color={colors.onDark} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  list: {
    gap: space.sm,
    alignSelf: 'stretch',
    marginTop: space.lg,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 52,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.chipOnDark,
  },
  chosen: { borderColor: colors.onDark },
  name: { flex: 1 },
  stroke: {
    width: 22,
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: '-30deg' }],
  },
});
