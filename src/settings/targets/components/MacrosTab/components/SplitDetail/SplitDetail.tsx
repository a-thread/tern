import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { typography } from '@shared/theme';
import { useSettings } from '@/domain/settings/SettingsContext';
import { gramRange, MacroSplits, type MacroSplit } from '@/domain/food/models/macroSplit';
import { MACRO_LABEL } from '../../models/macroLabel';

export function SplitDetail({ split }: { split: MacroSplit }) {
  const { settings } = useSettings();
  return (
    <View style={{ marginTop: 6, gap: 2 }}>
      {MacroSplits.KEYS.map((key) => {
        const range = gramRange(settings.calorieTarget, split[key], key);
        return (
          <Text key={key} style={s.rowSub}>
            {split[key]}% {MACRO_LABEL[key].toLowerCase()} · {range.low}-
            {range.high} g
          </Text>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  rowSub: { ...typography.caption, marginTop: 2 },
});
