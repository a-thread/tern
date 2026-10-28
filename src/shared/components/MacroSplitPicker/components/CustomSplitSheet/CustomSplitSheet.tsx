import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, typography } from '@shared/theme';
import { BottomSheet, Stepper } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import {
  gramRange,
  isValidSplit,
  macrosFromPercents,
  percentsFromMacros,
  splitTotal,
  MacroSplits,
  type MacroKey,
  type MacroSplit,
} from '@/domain/food/models/macroSplit';
import { MACRO_LABEL } from '../../models/macroLabel';

/** Sets the macro split by hand, a few percent at a time, until it adds up to 100%. */
export function CustomSplitSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { settings, updateSettings } = useSettings();
  const [draft, setDraft] = useState<MacroSplit>(() =>
    percentsFromMacros(settings.macroTargets),
  );

  // Each time the sheet opens it starts from the split in use.
  useEffect(() => {
    if (visible) setDraft(percentsFromMacros(settings.macroTargets));
  }, [visible, settings.macroTargets]);

  const nudgeDraft = (key: MacroKey, direction: 1 | -1) =>
    setDraft((d) => {
      const value = d[key] + direction * MacroSplits.STEP;
      if (value < MacroSplits.MIN_PERCENT || value > MacroSplits.MAX_PERCENT) {
        return d;
      }
      return { ...d, [key]: value };
    });

  const total = splitTotal(draft);
  const valid = isValidSplit(draft);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View>
        <View style={s.sheetTop}>
          <Text style={s.sheetTitle}>Custom split</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel='Close'>
            <Text style={s.close}>×</Text>
          </Pressable>
        </View>

        <View style={s.cols}>
          {MacroSplits.KEYS.map((key) => {
            const range = gramRange(settings.calorieTarget, draft[key], key);
            return (
              <View key={key} style={s.col}>
                <Text style={s.rowTitle}>{MACRO_LABEL[key]}</Text>
                <Text style={s.rowSub}>
                  {range.low}-{range.high} g
                </Text>
                <Stepper
                  style={{ marginTop: 10 }}
                  value={`${draft[key]}%`}
                  valueMinWidth={46}
                  decrementLabel={`Lower ${MACRO_LABEL[key]}`}
                  incrementLabel={`Raise ${MACRO_LABEL[key]}`}
                  onDecrement={() => nudgeDraft(key, -1)}
                  onIncrement={() => nudgeDraft(key, 1)}
                />
              </View>
            );
          })}
        </View>

        <View style={s.totalRow}>
          <Text style={s.rowTitle}>Total</Text>
          <Text style={[s.total, valid && { color: colors.kelp }]}>
            {total}%
          </Text>
        </View>
        {!valid ? <Text style={s.hint}>Total must equal 100%</Text> : null}

        <Pressable
          style={[s.update, !valid && s.updateOff]}
          disabled={!valid}
          onPress={() => {
            updateSettings({
              macroTargets: macrosFromPercents(settings.calorieTarget, draft),
            });
            onClose();
          }}
          accessibilityRole='button'
          accessibilityState={{ disabled: !valid }}
        >
          <Text style={s.updateText}>Update</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  rowTitle: typography.rowTitle,
  rowSub: { ...typography.caption, marginTop: 2 },
  sheetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  sheetTitle: typography.heading,
  close: { fontFamily: font.body, fontSize: 24, color: colors.ink3 },
  cols: { flexDirection: 'row', gap: 8 },
  col: { flex: 1, alignItems: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  total: { fontFamily: font.semibold, fontSize: 15, color: colors.ink2 },
  hint: { ...typography.caption, marginTop: 4 },
  update: {
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: space.lg,
  },
  updateOff: { opacity: 0.4 },
  updateText: { fontFamily: font.bold, fontSize: 14, color: '#fff' },
});
