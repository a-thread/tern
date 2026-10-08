import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, space } from '@shared/theme';

export type IntakeInfoKind = 'calories' | 'macros';

const COPY: Record<
  IntakeInfoKind,
  { title: string; lead: string; points: string[]; action?: string }
> = {
  calories: {
    title: 'About your target zone',
    lead: 'A range to land in over the day, not a line to stay under.',
    points: [
      'The zone starts around your calorie target, about 15% either side. You can set your own under Calorie & macro targets.',
      'Being below or above it is just information. Tern never warns you and it never affects your streak or waypoints.',
    ],
    action: 'Change the zone',
  },
  macros: {
    title: 'About your macro targets',
    lead: 'Targets are a reference point, not a limit.',
    points: [
      'Protein is a minimum to reach, so its bar has a mark at your target and keeps filling past it. Carbs and fat are guides to fill toward.',
      "The percentages are each macro's share of your calorie target. Change the split, or pick a preset, under Settings, then Calorie & macro targets.",
    ],
  },
};

/** A short explainer for the calories and macros slides, as a sheet that slides up from the bottom. */
export function IntakeInfoSheet({
  kind,
  visible,
  onClose,
  onAction,
}: {
  kind: IntakeInfoKind;
  visible: boolean;
  onClose: () => void;
  /** Runs the sheet's action link, when its copy has one. */
  onAction?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const copy = COPY[kind];
  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={onClose}
    >
      <Pressable style={s.scrim} onPress={onClose} accessibilityLabel='Close' />
      <View style={[s.sheet, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={s.top}>
          <Text style={s.title}>{copy.title}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel='Close'>
            <Text style={s.close}>×</Text>
          </Pressable>
        </View>
        <Text style={s.lead}>{copy.lead}</Text>
        {copy.points.map((p) => (
          <Text key={p} style={s.point}>
            {p}
          </Text>
        ))}
        {copy.action && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} accessibilityRole='button'>
            <Text style={s.action}>{copy.action}</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(43,38,34,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.lg,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  title: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  close: { fontFamily: font.body, fontSize: 24, color: colors.ink3 },
  lead: {
    fontFamily: font.medium,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
    marginBottom: space.xs,
  },
  point: {
    fontFamily: font.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.ink2,
    marginTop: space.sm,
  },
  action: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.coral,
    marginTop: space.lg,
  },
});
