import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, space, typography } from '@/shared/theme';
import LoadingBird from '@/shared/components/LoadingBird/LoadingBird';
import { SheetNav } from '@/shared/components/ui';
import { useLoggedFoods } from '../hooks/useLoggedFoods';
import type { LogFoodStackParamList } from '../navigation';
import { MealAdder, useMealAdder } from '../components/MealAdder/MealAdder';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'RecentMeal'>;

/** A meal you've already logged: what was in it, and one tap to log it again. */
export default function RecentMealScreen({ navigation, route }: Props) {
  const { meal: initialMeal, recentId } = route.params;
  const insets = useSafeAreaInsets();
  const { meals, loaded } = useLoggedFoods();
  const recent = meals.find((m) => m.id === recentId);
  const items = recent?.items ?? [];
  const adder = useMealAdder(items, initialMeal, navigation);

  if (!recent) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          paddingTop: insets.top,
        }}
      >
        <SheetNav
          title='Recent meal'
          leftLabel='Back'
          onLeftPress={() => navigation.goBack()}
        />
        {loaded ? (
          <Text style={s.gone}>This meal isn’t in your log any more.</Text>
        ) : (
          <LoadingBird
            size={48}
            color={colors.ink3}
            style={{ alignSelf: 'center', marginTop: space.xl }}
          />
        )}
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='Recent meal'
        leftLabel='Back'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Add'
        onRightPress={adder.add}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps='handled'
      >
        <View style={s.head}>
          <Text style={s.name}>{recent.title}</Text>
          <Text style={s.sub}>{adder.summary}</Text>
        </View>

        <MealAdder
          items={items}
          adder={adder}
          itemsLabel='What you had'
          scaleNoun='logged'
        />

        <Text style={s.note}>
          Adding this doesn’t change the day it came from.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingVertical: space.md },
  name: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  sub: { ...typography.meta, marginTop: 4 },
  note: {
    fontFamily: font.body,
    fontSize: 12,
    color: colors.ink2,
    textAlign: 'center',
    paddingTop: space.lg,
  },
  gone: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.ink2,
    textAlign: 'center',
    padding: space.xl,
  },
});
