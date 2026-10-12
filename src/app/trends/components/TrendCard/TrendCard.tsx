import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, space, typography } from '@/shared/theme';
import { Card } from '@/shared/components/ui/Layout';

/** A Trends card: a small title over whatever the card shows. Tappable when `onPress` is given. */
export function TrendCard({
  title,
  onPress,
  children,
}: {
  title?: string;
  onPress?: () => void;
  children: React.ReactNode;
}) {
  const card = (
    <Card style={{ marginBottom: space.md }}>
      {title ? <Text style={s.title}>{title}</Text> : null}
      {children}
    </Card>
  );
  return onPress ? <Pressable onPress={onPress}>{card}</Pressable> : card;
}

/** A card's headline figure and the line explaining it. */
export function TrendFigure({ value, sub }: { value: string; sub: string }) {
  return (
    <View style={{ flexShrink: 1 }}>
      <Text style={s.value}>{value}</Text>
      <Text style={s.sub}>{sub}</Text>
    </View>
  );
}

/** A figure with a change badge at its right (e.g. "+8%"), the head of the steps and weight cards. */
export function TrendHeader({
  title,
  value,
  sub,
  delta,
}: {
  title: string;
  value: string;
  sub: string;
  delta?: { text: string; bg: string; color: string } | null;
}) {
  return (
    <View style={s.top}>
      <View style={{ flexShrink: 1 }}>
        <Text style={s.title}>{title}</Text>
        <TrendFigure value={value} sub={sub} />
      </View>
      {delta ? (
        <View style={[s.delta, { backgroundColor: delta.bg }]}>
          <Text style={[s.deltaText, { color: delta.color }]}>{delta.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  delta: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  deltaText: { fontFamily: font.semibold, fontSize: 11 },
  title: typography.label,
  value: typography.stat,
  sub: typography.small,
});
