import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, space, typography } from '@shared/theme';
import { Group, GroupLabel, SheetNav } from '@shared/components/ui';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { dayWord } from '@shared/utils/date';
import type { RootStackParamList } from '@/navigation/types';
import { Meal } from '@/domain/food/models/foodEntry';
import { useMealCheckIns } from '@/domain/meal-check-ins/MealCheckInsContext';
import { MealCheckInMetric } from '@/domain/meal-check-ins/models/mealCheckIn';
import { ScoreChoice } from './components/ScoreChoice/ScoreChoice';
import { NoteField } from './components/NoteField/NoteField';

type Props = NativeStackScreenProps<RootStackParamList, 'MealCheckIn'>;

/** "lunch", or "your snack": how the meal reads in a sentence. */
const mealWords = (meal: Meal) => (meal === Meal.Snack ? 'your snack' : meal);

/**
 * A quick check-in after a meal: how full you are and how you feel, each picked from five
 * choices, and a note if you like. Nothing is judged; it is only there to look back on.
 */
export default function MealCheckInScreen({ navigation, route }: Props) {
  const { meal } = route.params;
  const insets = useSafeAreaInsets();
  const { day, today } = useViewedDay();
  const { forMeal, checkIn, clear } = useMealCheckIns();
  const existing = forMeal(meal);
  const [fullness, setFullness] = useState<number | null>(
    existing?.fullness ?? null,
  );
  const [feeling, setFeeling] = useState<number | null>(
    existing?.feeling ?? null,
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const words = mealWords(meal);

  const save = () => {
    if (fullness === null || feeling === null) return;
    checkIn(meal, fullness, feeling, note);
    navigation.goBack();
  };

  const remove = () => {
    clear(meal);
    navigation.goBack();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='Check in'
        leftLabel='Cancel'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Save'
        onRightPress={save}
        rightDisabled={fullness === null || feeling === null}
      />

      <ScrollView
        keyboardShouldPersistTaps='handled'
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <View style={s.head}>
          <Text style={s.title}>{`How was ${words}?`}</Text>
          <Text style={s.sub}>{dayWord(day, today)}</Text>
        </View>

        <GroupLabel>How full are you?</GroupLabel>
        <ScoreChoice
          metric={MealCheckInMetric.Fullness}
          label='Fullness'
          value={fullness}
          onChange={setFullness}
          color={colors.kelp}
          tint={colors.kelpTint}
        />

        <GroupLabel>How do you feel?</GroupLabel>
        <ScoreChoice
          metric={MealCheckInMetric.Feeling}
          label='Feeling'
          value={feeling}
          onChange={setFeeling}
          color={colors.violet}
          tint={colors.violetTint}
        />

        <GroupLabel>Note (optional)</GroupLabel>
        <NoteField value={note} onChange={setNote} />

        <Text style={s.hint}>
          There are no right answers. Tern only shows you how meals tend to sit
          with you over time.
        </Text>

        {existing ? (
          <Group style={{ marginTop: space.lg }}>
            <Pressable
              style={s.row}
              onPress={remove}
              accessibilityRole='button'
            >
              <Text style={s.danger}>Remove this check-in</Text>
            </Pressable>
          </Group>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingVertical: space.md },
  title: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  sub: { ...typography.meta, marginTop: 4 },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
    marginTop: space.lg,
  },
  row: { paddingHorizontal: 13, paddingVertical: 12 },
  danger: { ...typography.rowTitle, color: colors.coral },
});
