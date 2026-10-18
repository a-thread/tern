import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { FoodSummary } from '@shared/components/FoodSummary/FoodSummary';
import { useFood } from '@/domain/food/FoodContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import { DoneList } from './DoneList/DoneList';

/**
 * The quiet lists under the rest scene: what was done, the food if any was logged, and "Log
 * something anyway" to bring back the usual lists (not while the tern is flying off).
 */
export function RestDayLists({
  onReveal,
  leaving,
}: {
  onReveal: () => void;
  leaving: boolean;
}) {
  const { editable } = useViewedDay();
  const { foodLog } = useFood();
  const { settings } = useSettings();

  return (
    <>
      {editable && !leaving ? (
        <Pressable
          onPress={onReveal}
          hitSlop={8}
          style={s.anyway}
          accessibilityRole='button'
        >
          <Text style={s.anywayText}>Log something anyway</Text>
        </Pressable>
      ) : null}
      <DoneList quietWhenEmpty />
      {foodLog.length > 0 && settings.trackCalories ? <FoodSummary /> : null}
    </>
  );
}

const s = StyleSheet.create({
  anyway: { alignSelf: 'center', paddingVertical: space.md },
  anywayText: { fontFamily: font.semibold, fontSize: 13, color: colors.coral },
});
