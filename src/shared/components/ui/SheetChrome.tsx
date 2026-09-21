import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, font, space } from '../../theme';

/** Nav bar for logging sheets: Cancel/Back on the left, an optional bold action on the right. */
export function SheetNav({
  title,
  onLeftPress,
  leftLabel = 'Cancel',
  rightLabel,
  onRightPress,
  rightDisabled,
}: {
  title: string;
  onLeftPress: () => void;
  leftLabel?: string;
  rightLabel?: string;
  onRightPress?: () => void;
  rightDisabled?: boolean;
}) {
  return (
    <View style={s.sheetNav}>
      <Pressable onPress={onLeftPress} hitSlop={8}>
        <Text style={s.sheetCancel}>{leftLabel}</Text>
      </Pressable>
      <Text style={s.sheetTitle}>{title}</Text>
      {rightLabel ? (
        <Pressable onPress={onRightPress} disabled={rightDisabled} hitSlop={8}>
          <Text style={[s.sheetSave, rightDisabled && { color: colors.ink3 }]}>
            {rightLabel}
          </Text>
        </Pressable>
      ) : (
        <View style={{ width: 44 }} />
      )}
    </View>
  );
}

/** Push-screen nav bar: a coral back chevron + label, centered title. */
export function PushHeader({
  title,
  backLabel = 'Back',
  onBack,
}: {
  title: string;
  backLabel?: string;
  onBack: () => void;
}) {
  return (
    <View style={s.pushHeader}>
      <Pressable onPress={onBack} hitSlop={8} style={s.pushBack}>
        <Svg
          width={15}
          height={15}
          viewBox='0 0 24 24'
          fill='none'
          stroke={colors.coral}
          strokeWidth={3}
        >
          <Path d='M15 6l-6 6 6 6' />
        </Svg>
        <Text style={s.pushBackText} numberOfLines={1}>
          {backLabel}
        </Text>
      </Pressable>
      <Text style={s.pushTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={s.pushSpacer} />
    </View>
  );
}

const s = StyleSheet.create({
  sheetNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  sheetCancel: { fontFamily: font.body, fontSize: 14, color: colors.ink2 },
  sheetTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  sheetSave: { fontFamily: font.bold, fontSize: 14, color: colors.coral },
  pushHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  // Equal flexible slots either side keep the title centred without ever
  // squeezing the back label (a fixed width made "Settings" wrap).
  pushBack: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  pushSpacer: { flex: 1 },
  pushBackText: {
    flexShrink: 1,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.coral,
  },
  pushTitle: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
});
