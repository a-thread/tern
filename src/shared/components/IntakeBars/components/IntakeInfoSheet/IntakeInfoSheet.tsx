import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@shared/components/ui';
import { colors, font, space, typography } from '@shared/theme';
import { IntakeInfoKind, intakeInfoCopy } from './models/intakeInfoCopy';

/** A short explainer for the calories and macros slides, as a sheet that slides up from the bottom. */
export function IntakeInfoSheet({
  kind,
  visible,
  onClose,
  onAction,
  proteinAsMinimum,
}: {
  kind: IntakeInfoKind;
  /** Protein set as a minimum to reach (Settings), which the macros copy explains. */
  proteinAsMinimum: boolean;
  visible: boolean;
  onClose: () => void;
  /** Runs the sheet's action link, when its copy has one. */
  onAction?: () => void;
}) {
  const copy = intakeInfoCopy(kind, { proteinAsMinimum });
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View>
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
    </BottomSheet>
  );
}

const s = StyleSheet.create({
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
  title: typography.heading,
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
