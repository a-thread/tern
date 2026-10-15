import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@shared/theme';
import { Group, GroupLabel, ToggleRow } from '@shared/components/ui';
import { useSettings } from '@/domain/settings/SettingsContext';
import {
  macrosFromPercents,
  matchPreset,
  percentsFromMacros,
  MacroSplits,
  type MacroSplit,
} from '@/domain/food/models/macroSplit';
import { CustomSplitSheet } from './components/CustomSplitSheet/CustomSplitSheet';
import { Radio } from './components/Radio/Radio';
import { SplitDetail } from './components/SplitDetail/SplitDetail';

/** The Macros tab of Targets: pick a preset split or set your own, and how protein is shown. */
export function MacrosTab() {
  const { settings, updateSettings } = useSettings();
  const [editing, setEditing] = useState(false);

  const split = percentsFromMacros(settings.macroTargets);
  const selected = matchPreset(split);

  const applySplit = (next: MacroSplit) =>
    updateSettings({
      macroTargets: macrosFromPercents(settings.calorieTarget, next),
    });

  return (
    <>
      <GroupLabel>Macro split</GroupLabel>
      <Group>
        {MacroSplits.PRESETS.map((p) => {
          const on = selected?.key === p.key;
          return (
            <Pressable
              key={p.key}
              style={s.presetRow}
              android_ripple={{ color: colors.doveTint }}
              onPress={() => applySplit(p.split)}
              accessibilityRole='radio'
              accessibilityState={{ selected: on }}
            >
              <Radio on={on} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{p.name}</Text>
                <Text style={s.rowSub}>{p.sub}</Text>
                {on ? <SplitDetail split={split} /> : null}
              </View>
            </Pressable>
          );
        })}
        <Pressable
          style={s.presetRow}
          android_ripple={{ color: colors.doveTint }}
          onPress={() => setEditing(true)}
          accessibilityRole='radio'
          accessibilityState={{ selected: !selected }}
        >
          <Radio on={!selected} />
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>Custom</Text>
            <Text style={s.rowSub}>Set your own split</Text>
            {!selected ? <SplitDetail split={split} /> : null}
          </View>
        </Pressable>
      </Group>

      {settings.showIntakeBars ? (
        <>
          <GroupLabel>Intake bars</GroupLabel>
          <Group>
            <ToggleRow
              title='Protein as a minimum'
              sub='Something to reach, not a limit'
              on={settings.proteinAsMinimum}
              onToggle={(v) => updateSettings({ proteinAsMinimum: v })}
            />
          </Group>
        </>
      ) : null}

      <CustomSplitSheet visible={editing} onClose={() => setEditing(false)} />
    </>
  );
}

const s = StyleSheet.create({
  presetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowTitle: typography.rowTitle,
  rowSub: { ...typography.caption, marginTop: 2 },
});
