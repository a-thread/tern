import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space } from '@shared/theme';
import { Card, ProgressBar } from '@shared/components/ui';
import { useToast } from '@shared/state/ToastContext';
import { useUnits } from '@settings/useUnits';
import { MAX_DRINK_OZ } from './models';
import { useWater } from './WaterContext';

/** Today's water on the Food screen: progress toward the goal, quick-add drink sizes and an undo. */
export default function WaterCard() {
  const { totalOz, goalOz, progress, reached, addWater, undoLast, lastOz } = useWater();
  const { formatVolume, quickWaterOz, fromDisplayVolume, toDisplayVolume, volumeLabel } = useUnits();
  const toast = useToast();
  const [custom, setCustom] = useState<string | null>(null); // the typed amount, while "Other" is open

  const addCustom = () => {
    const typed = parseFloat((custom ?? '').replace(',', '.'));
    const oz = Number.isFinite(typed) ? fromDisplayVolume(typed) : NaN;
    if (!addWater(oz)) {
      toast.show(`Enter an amount up to ${toDisplayVolume(MAX_DRINK_OZ)} ${volumeLabel}.`);
      return;
    }
    setCustom(null);
  };

  return (
    <Card style={{ marginTop: space.md }}>
      <View style={s.top}>
        <View style={s.title}>
          <Svg width={15} height={15} viewBox='0 0 24 24' fill='none'>
            <Path
              d='M12 3c-4 3-6 6-6 9a6 6 0 0 0 12 0c0-3-2-6-6-9z'
              stroke={colors.water}
              strokeWidth={2}
            />
          </Svg>
          <Text style={s.name}>Water</Text>
        </View>
        <Text style={s.amount}>
          {`${formatVolume(totalOz)} of ${formatVolume(goalOz)}`}
        </Text>
      </View>
      <View style={{ marginTop: space.sm }}>
        <ProgressBar value={progress} color={colors.water} height={7} />
      </View>
      {reached ? <Text style={s.done}>Goal reached. Nicely done.</Text> : null}

      <View style={s.quickRow}>
        {quickWaterOz.map((oz) => (
          <Pressable
            key={oz}
            onPress={() => addWater(oz)}
            style={s.quick}
            accessibilityRole='button'
            accessibilityLabel={`Add ${formatVolume(oz)} of water`}
          >
            <Text style={s.quickText}>{`+${toDisplayVolume(oz)} ${volumeLabel}`}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setCustom(custom === null ? '' : null)}
          style={[s.quick, custom !== null && s.quickOn]}
          accessibilityRole='button'
          accessibilityLabel='Add another amount of water'
        >
          <Text style={s.quickText}>Other</Text>
        </Pressable>
      </View>

      {custom !== null ? (
        <View style={s.customRow}>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={addCustom}
            keyboardType='decimal-pad'
            placeholder={`Amount in ${volumeLabel}`}
            placeholderTextColor={colors.ink3}
            maxLength={6}
            autoFocus
            accessibilityLabel={`Amount of water in ${volumeLabel}`}
            style={s.input}
          />
          <Pressable onPress={addCustom} style={s.addBtn} accessibilityRole='button'>
            <Text style={s.addText}>Add</Text>
          </Pressable>
        </View>
      ) : null}

      {lastOz !== null ? (
        <Pressable onPress={undoLast} hitSlop={8} accessibilityRole='button'>
          <Text style={s.undo}>{`Undo last (${formatVolume(lastOz)})`}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  title: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  name: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  amount: { fontFamily: font.body, fontSize: 12, color: colors.ink2, flexShrink: 1, textAlign: 'right' },
  done: { fontFamily: font.body, fontSize: 11.5, color: colors.water, marginTop: 6 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.md },
  quick: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.waterTint,
  },
  quickOn: { backgroundColor: colors.doveTint },
  quickText: { fontFamily: font.semibold, fontSize: 12.5, color: colors.water },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  input: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addText: { fontFamily: font.bold, fontSize: 13.5, color: '#fff' },
  undo: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.ink2,
    marginTop: space.md,
    textAlign: 'center',
  },
});
