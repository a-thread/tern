import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { popup } from '@shared/components/PopupCard/PopupCard';
import { colors, radius, space } from '@shared/theme';
import { TRAIL_PALETTE } from '@shared/models/trailPalette';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useSubscription } from '@/domain/subscription/SubscriptionContext';
import { TrailColors } from '@/domain/settings/models/trailColor';

/**
 * A Supporter's thank-you, on the route card where the trail is drawn: the colour of the line
 * their tern has flown. Each choice is a stroke on the night sky. Hidden for everyone else.
 */
export function TrailPicker() {
  const { supporter } = useSubscription();
  const { settings, updateSettings } = useSettings();
  if (!supporter) return null;

  return (
    <View style={popup.section}>
      <Text style={popup.sectionTitle}>Your trail</Text>
      <View style={s.choices} accessibilityRole='radiogroup'>
        {TrailColors.ALL.map((trail) => {
          const chosen = settings.trailColor === trail;
          const name = TrailColors.NAMES[trail];
          return (
            <Pressable
              key={trail}
              style={[s.choice, chosen && s.chosen]}
              onPress={() => updateSettings({ trailColor: trail })}
              hitSlop={4}
              accessibilityRole='radio'
              accessibilityState={{ checked: chosen }}
              accessibilityLabel={`${name} trail`}
            >
              <View
                style={[s.stroke, { backgroundColor: TRAIL_PALETTE[trail] }]}
              />
              <Text style={popup.soft} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[popup.soft, s.note]}>
        A thank-you for supporting Tern. It goes back to Arctic if Supporter
        ends, and your colour comes back if you support again.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  choices: { flexDirection: 'row', gap: space.sm },
  choice: {
    flex: 1,
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.chipOnDark,
  },
  chosen: { borderColor: colors.onDark },
  stroke: {
    width: 22,
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: '-30deg' }],
  },
  note: { marginTop: space.sm, lineHeight: 17 },
});
