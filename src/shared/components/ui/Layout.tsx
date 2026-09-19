import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors, font, radius, space } from '../../theme';
import { Chevron } from './Chevron';

/* ---------- typography ---------- */

export function LargeTitle({
  children,
  eyebrow,
}: {
  children: string;
  eyebrow?: string;
}) {
  return (
    <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
      {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
      <Text style={s.largeTitle}>{children}</Text>
    </View>
  );
}

export function GroupLabel({ children }: { children: string }) {
  return <Text style={s.groupLabel}>{children}</Text>;
}

export function FootNote({ children }: { children: string }) {
  return <Text style={s.footNote}>{children}</Text>;
}

/* ---------- containers ---------- */

export function Group({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const items = React.Children.toArray(children);
  return (
    <View style={[s.group, style]}>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 ? <View style={s.divider} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}

/* ---------- rows ---------- */

type RowProps = {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  value?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
};

export function Row({
  title,
  sub,
  icon,
  value,
  right,
  chevron,
  onPress,
}: RowProps) {
  const body = (
    <View style={s.row}>
      {icon ? <View style={s.iconSlot}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      {right}
      {chevron ? <Chevron /> : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} android_ripple={{ color: colors.doveTint }}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function IconBadge({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return <View style={[s.iconBadge, { backgroundColor: bg }]}>{children}</View>;
}

/* ---------- bits ---------- */

export function Chip({
  children,
  bg = colors.coralTint,
  color = colors.coral,
}: {
  children: React.ReactNode;
  bg?: string;
  color?: string;
}) {
  return (
    <View style={[s.chip, { backgroundColor: bg }]}>
      {typeof children === 'string' ? (
        <Text style={[s.chipText, { color }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export function Insight({
  children,
  bg = colors.auroraTint,
  icon,
}: {
  children: string;
  bg?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={[s.insight, { backgroundColor: bg }]}>
      {icon ? <View style={s.insightIcon}>{icon}</View> : null}
      <Text style={s.insightText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrow: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  largeTitle: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  groupLabel: {
    fontFamily: font.semibold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink2,
    marginLeft: space.xs + 2,
    marginTop: space.lg,
    marginBottom: 7,
  },
  footNote: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 17,
    color: colors.ink3,
    paddingHorizontal: space.sm,
    paddingTop: space.sm,
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md + 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: space.md + 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 11,
  },
  iconSlot: {},
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 2,
    lineHeight: 16,
  },
  rowValue: { fontFamily: font.body, fontSize: 13.5, color: colors.ink2 },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontFamily: font.semibold, fontSize: 12 },
  insight: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    marginTop: space.md,
  },
  insightIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
  },
});
