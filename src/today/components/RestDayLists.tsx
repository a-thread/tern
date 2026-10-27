import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { IntakeBars } from '@shared/components/IntakeBars/IntakeBars';
import { useFood } from '@/domain/food/FoodContext';
import { DoneList } from './DoneList/DoneList';

/**
 * The quiet lists under the rest scene: what was done, the food if any was logged, and "Log
 * something" to bring back the usual lists (not while the tern is flying off).
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

  return (
    <>
      {editable && !leaving ? (
        <Pressable
          onPress={onReveal}
          hitSlop={8}
          style={s.anyway}
          accessibilityRole='button'
        >
          <Text style={s.anywayText}>Log something</Text>
        </Pressable>
      ) : null}
      <DoneList quietWhenEmpty />
      {foodLog.length > 0 ? <IntakeBars /> : null}
    </>
  );
}

const s = StyleSheet.create({
  anyway: { alignSelf: 'center', paddingVertical: space.md },
  anywayText: { fontFamily: font.semibold, fontSize: 13, color: colors.coral },
});
