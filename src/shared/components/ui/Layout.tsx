import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors, font, radius, space, typography } from '../../theme';
import { Chevron } from './Chevron';

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
        // The child's own key (toArray keeps it), so a row that moves keeps its view.
        <View
          key={
            React.isValidElement(child) && child.key !== null ? child.key : i
          }
        >
          {i > 0 ? <View style={s.divider} /> : null}
          {child}
        </View>
      ))}
    </View>
  );
}

/** The hairline between rows of a Group, for rows that live inside one feature component. */
export function Divider() {
  return <View style={s.divider} />;
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
  /** Cap the sub line (it ellipsizes); unset lets it wrap. */
  subLines?: number;
  /** The sub line is the row's call to action ("Learn about Tern Plus"), so it reads as a link. */
  subLink?: boolean;
  icon?: React.ReactNode;
  value?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
};

export function Row({
  title,
  sub,
  subLines,
  subLink,
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
        {sub ? (
          <Text style={[s.rowSub, subLink && s.rowSubLink]} numberOfLines={subLines}>
            {sub}
          </Text>
        ) : null}
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
  size = 28,
  children,
}: {
  bg: string;
  /** Side of the square; the corners scale down for the small tiles beside a row's text. */
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        s.iconBadge,
        {
          backgroundColor: bg,
          width: size,
          height: size,
          borderRadius: size < 24 ? 6 : radius.sm,
        },
      ]}
    >
      {children}
    </View>
  );
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

const s = StyleSheet.create({
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
  rowTitle: typography.rowTitle,
  rowSub: { ...typography.caption, marginTop: 2, lineHeight: 16 },
  rowSubLink: { fontFamily: font.semibold, color: colors.water },
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
});
