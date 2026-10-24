import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, space, typography } from '../../theme';
import { Icon } from '../ui';
import { useRootNavigation } from '@/navigation/useAppNavigation';

/** Light ink on the page, or pale ink over a dark hero (Journey). */
export enum TabHeaderTone {
  Light = 'light',
  OnDark = 'onDark',
}

const INK = {
  [TabHeaderTone.Light]: {
    eyebrow: colors.ink2,
    title: colors.ink,
    gear: colors.ink2,
  },
  [TabHeaderTone.OnDark]: {
    eyebrow: '#BDB4D6',
    title: '#F4F1F8',
    gear: '#F4F1F8',
  },
};

/**
 * The top of every tab: a small line above (a date, a month), the big title, and on the right
 * anything the tab adds (the waypoints chip, "Back to today") followed by the settings gear,
 * so Settings is one tap from every tab.
 */
export function TabHeader({
  eyebrow,
  title,
  accessory,
  tone = TabHeaderTone.Light,
  style,
}: {
  /** Text, or a control such as the Food tab's day switcher. */
  eyebrow: React.ReactNode;
  title: string;
  /** Sits just left of the gear. */
  accessory?: React.ReactNode;
  tone?: TabHeaderTone;
  /** Layout overrides, e.g. Journey drops the padding its hero already has. */
  style?: ViewStyle;
}) {
  const navigation = useRootNavigation();
  const ink = INK[tone];

  return (
    <View style={[s.header, style]}>
      <View style={s.titles}>
        {typeof eyebrow === 'string' ? (
          <Text style={[s.eyebrow, { color: ink.eyebrow }]}>{eyebrow}</Text>
        ) : (
          eyebrow
        )}
        <Text
          style={[s.title, { color: ink.title }]}
          accessibilityRole='header'
        >
          {title}
        </Text>
      </View>
      <View style={s.actions}>
        {accessory}
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          hitSlop={8}
          style={s.gear}
          accessibilityRole='button'
          accessibilityLabel='Settings'
        >
          <Icon name='cog-outline' size={21} color={ink.gear} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  titles: { flexShrink: 1 },
  eyebrow: typography.meta,
  title: typography.screenTitle,
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gear: { padding: 2 },
});
