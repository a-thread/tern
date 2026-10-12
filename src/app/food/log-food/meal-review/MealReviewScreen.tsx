import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { colors, font, radius, space, typography } from '@/shared/theme';
import { Group, GroupLabel } from '@/shared/components/ui/Layout';
import { SheetNav } from '@/shared/components/ui/SheetChrome';
import { SwipeToRemove } from '@/food/components/SwipeToRemove/SwipeToRemove';
import type { RootStackParamList } from '@/navigation/types';
import { Meals } from '@/domain/food/models/meals';
import { dayTotals } from '@/domain/food/models/foodEntry';
import { useFood } from '@/domain/food/FoodContext';
import { useFoodDisplay } from '@/domain/food/hooks/useFoodDisplay';
import ItemRow from '@/food/components/ItemRow/ItemRow';
import { ListNote } from '@/food/log-food/components/ListNote/ListNote';
import type { LogFoodStackParamList } from '@/food/log-food/navigation';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'MealReview'>;

/** Everything in the meal being added to, with its totals; tap a food to change or remove it. */
export default function MealReviewScreen({ navigation, route }: Props) {
  const { meal } = route.params;
  const insets = useSafeAreaInsets();
  const { foodLog, removeFoodEntry } = useFood();
  const { showCalories } = useFoodDisplay();
  // Editing and saving live on the root stack, above this one.
  const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const label = Meals.OPTIONS.find((m) => m.key === meal)?.label ?? meal;
  const entries = foodLog.filter((f) => f.meal === meal);
  const totals = dayTotals(entries);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <SheetNav
        title='Review'
        leftLabel='Back'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Done'
        onRightPress={() => navigation.getParent()?.goBack()}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 40 }}>
        <View style={s.head}>
          <Text style={s.name}>{label}</Text>
          <Text style={s.sub}>
            {entries.length} {entries.length === 1 ? 'food' : 'foods'}
            {showCalories ? ` · ${Math.round(totals.calories)} cal` : ''}
          </Text>
        </View>

        {entries.length ? (
          <View style={s.macros}>
            <Macro value={totals.protein} label='protein' />
            <Macro value={totals.carbs} label='carbs' />
            <Macro value={totals.fat} label='fat' />
          </View>
        ) : null}

        <GroupLabel>
          {entries.length ? `In ${label.toLowerCase()} · tap a food to change it, swipe to remove` : `In ${label.toLowerCase()}`}
        </GroupLabel>
        {entries.length ? (
          <Group>
            {entries.map((item) => (
              <SwipeToRemove key={item.id} onRemove={() => removeFoodEntry(item.id)}>
                <ItemRow item={item} onPress={() => root?.navigate('EditFood', { entryId: item.id })} />
              </SwipeToRemove>
            ))}
          </Group>
        ) : (
          <ListNote>{`Nothing in ${label.toLowerCase()} yet.`}</ListNote>
        )}

        <Pressable style={s.bigBtn} onPress={() => navigation.goBack()}>
          <Text style={s.bigBtnText}>Add more food</Text>
        </Pressable>
        {entries.length ? (
          <Pressable onPress={() => root?.navigate('SaveMeal', { meal })} hitSlop={8} style={s.link}>
            <Text style={s.linkText}>Save as meal</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Macro({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.macroVal}>{Math.round(value)}g</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingVertical: space.md },
  name: { fontFamily: font.display, fontSize: 24, color: colors.ink, letterSpacing: -0.2 },
  sub: { ...typography.meta, marginTop: 4 },
  macros: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
  },
  macroVal: { fontFamily: font.bold, fontSize: 15, color: colors.ink, textAlign: 'center' },
  macroLabel: { ...typography.small, textAlign: 'center', marginTop: 1 },
  bigBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: space.lg,
  },
  bigBtnText: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
  link: { alignItems: 'center', paddingVertical: 13, marginTop: 4 },
  linkText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.coral },
});
