import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font } from '../../theme';

export function Toggle({ on, onPress }: { on: boolean; onPress?: () => void }) {
  const body = (
    <View style={[s.toggle, on && { backgroundColor: colors.coral }]}>
      <View style={[s.knob, on && { left: 20 }]} />
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={8}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

/** A settings row: title/sub on the left, a toggle switch on the right. */
export function ToggleRow({
  title,
  sub,
  on,
  onToggle,
}: {
  title: string;
  sub?: string;
  on: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      <Toggle on={on} onPress={() => onToggle(!on)} />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 11,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 2,
    lineHeight: 16,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 14,
    backgroundColor: colors.dove,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    left: 2.5,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
