import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius } from '@shared/theme';
import { IconBadge, Row, Icon } from '@shared/components/ui';
import { useDrinkCelebration } from '@shared/hooks/useDrinkCelebration';
import { useUnits } from '@/domain/settings/hooks/useUnits';
import { useWater } from '@/domain/water/WaterContext';
import { useOpenWaterSheet } from '../../hooks/useWaterSheet';

/** Water in the "Left to do" list: today's total, and a quick-add button that splashes when it logs a drink. */
export function WaterTodoRow() {
  const { totalOz, goalOz, addWater } = useWater();
  const { formatVolume, quickWaterOz } = useUnits();
  const openWaterSheet = useOpenWaterSheet();
  const celebrate = useDrinkCelebration();
  const buttonRef = useRef<View>(null);
  const oz = quickWaterOz[0];

  // The splash is drawn on Today's splash layer, so it outlives this row when the goal drink moves water to the done list.
  const add = () => {
    const wasShort = totalOz < goalOz;
    if (addWater(oz))
      celebrate(wasShort && totalOz + oz >= goalOz, buttonRef.current);
  };

  return (
    <Row
      title='Water'
      sub={`${formatVolume(totalOz)} of ${formatVolume(goalOz)}`}
      onPress={openWaterSheet}
      icon={
        <IconBadge bg={colors.waterTint}>
          <Icon name='water-outline' size={16} color={colors.water} />
        </IconBadge>
      }
      right={
        // Only the button logs a drink; tapping the row opens the water sheet, so a stray tap can't log one.
        <Pressable
          ref={buttonRef}
          onPress={add}
          hitSlop={8}
          style={({ pressed }) => [s.addBtn, pressed && s.addBtnPressed]}
          accessibilityRole='button'
          accessibilityLabel={`Add ${formatVolume(oz)} of water`}
        >
          <Text style={s.addText}>{`+${formatVolume(oz)}`}</Text>
        </Pressable>
      }
    />
  );
}

const s = StyleSheet.create({
  addText: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
  addBtn: {
    backgroundColor: colors.coralTint,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addBtnPressed: { transform: [{ scale: 0.92 }], opacity: 0.8 },
});
