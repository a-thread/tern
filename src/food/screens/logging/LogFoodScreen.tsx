import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, space } from '@shared/theme';
import { SheetNav, FootNote, SegmentedControl } from '@shared/components/ui';
import type { SearchResult } from '@food/data/sources/searchResult';
import type { RecentMeal } from '@food/models/recentMeals';
import type { SavedMeal } from '@food/models/savedMeals';
import { describeAdditions } from '@food/models/sessionAdditions';
import { useFood } from '@food/FoodContext';
import { useSavedMeals } from '@food/SavedMealsContext';
import { useSessionAdditions } from '@food/hooks/useSessionAdditions';
import { FOOD_FILTERS, useFoodLookup, type FoodFilter } from '@food/hooks/useFoodLookup';
import AddedBanner from '@food/components/AddedBanner';
import { FoodGroup } from '@food/components/FoodGroup';
import { FoodSearchBar } from '@food/components/FoodSearchBar';
import { ListNote } from '@food/components/ListNote';
import { LogFoodAllTab } from '@food/components/LogFoodAllTab';
import { LogFoodMealsTab } from '@food/components/LogFoodMealsTab';
import type { LogFoodStackParamList } from '@food/navigation';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'Search'>;

/** Search, scan or pick from your own meals and foods to log into a meal. */
export default function LogFoodScreen({ navigation, route }: Props) {
  // `pick`: choosing a food for a saved meal being built, not logging to today.
  const { meal, pick: pickMode } = route.params;
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FoodFilter>('All');

  // Adding a food returns here, so confirm what went in and offer Done. (Not when
  // choosing foods for a saved meal: those go to the meal being edited.)
  const added = useSessionAdditions();
  const addedMessage = pickMode ? null : describeAdditions(added);
  const { draft, startDraft } = useSavedMeals();
  const filters = pickMode ? FOOD_FILTERS.filter((f) => f !== 'Meals') : FOOD_FILTERS;

  // Once a food goes in, the search that found it has done its job: the next
  // one is rarely the same words, and a stale query hides your own foods and
  // meals underneath it. (In pick mode the food lands in the draft, not the log.)
  const goneIn = pickMode ? (draft?.items.length ?? 0) : added.length;
  const lastGoneIn = useRef(goneIn);
  useEffect(() => {
    if (goneIn > lastGoneIn.current) setQuery('');
    lastGoneIn.current = goneIn;
  }, [goneIn]);

  // Review shows everything in the meal being added to (or the saved meal being built).
  const { foodLog } = useFood();
  const inMealCount = pickMode ? (draft?.items.length ?? 0) : foodLog.filter((f) => f.meal === meal).length;
  const reviewMeal = () => (pickMode ? navigation.goBack() : navigation.navigate('MealReview', { meal }));

  const lookup = useFoodLookup({ query, filter, pickMode: Boolean(pickMode), meal });
  const { trimmed, recent } = lookup;

  // Every result carries nutrition (results without it are filtered out), so
  // it always goes to the details screen; only a missing food type is asked for there.
  const pickFood = (result: SearchResult) => navigation.navigate('FoodDetail', { meal, result, pick: pickMode });
  const openMeal = (m: SavedMeal) => navigation.navigate('SavedMeal', { meal, mealId: m.id });
  const openPastMeal = (m: RecentMeal) => navigation.navigate('RecentMeal', { meal, recentId: m.id });
  const newMeal = () => {
    startDraft();
    navigation.navigate('MealEditor');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <SheetNav
        title={pickMode ? 'Add food to meal' : `Add to ${meal}`}
        leftLabel={addedMessage ? 'Done' : 'Cancel'}
        onLeftPress={() => (pickMode ? navigation.goBack() : navigation.getParent()?.goBack())}
        rightLabel={inMealCount ? `Review (${inMealCount})` : undefined}
        onRightPress={reviewMeal}
      />

      <FoodSearchBar
        value={query}
        onChange={setQuery}
        onScan={() => navigation.navigate('BarcodeScan', { meal, pick: pickMode })}
        busy={filter === 'All' && lookup.pending}
      />

      <SegmentedControl options={filters} value={filter} onChange={setFilter} style={s.seg} />

      {addedMessage ? <AddedBanner message={addedMessage} /> : null}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps='handled'
      >
        {filter === 'All' ? (
          <LogFoodAllTab
            lookup={lookup}
            onPickFood={pickFood}
            onOpenMeal={openMeal}
            onOpenPastMeal={openPastMeal}
          />
        ) : null}

        {filter === 'Meals' ? (
          <LogFoodMealsTab lookup={lookup} onNewMeal={newMeal} onOpenMeal={openMeal} onOpenPastMeal={openPastMeal} />
        ) : null}

        {filter === 'Recent' ? (
          recent.length ? (
            <FoodGroup label='Logged recently' foods={recent} onPick={pickFood} />
          ) : (
            <ListNote>
              {trimmed ? `Nothing recent matches “${trimmed}”.` : 'Nothing logged in the last two weeks.'}
            </ListNote>
          )
        ) : null}

        <Pressable
          onPress={() => navigation.navigate('ManualFoodEntry', { meal, pick: pickMode })}
          style={s.ghostBtn}
        >
          <Text style={s.ghostText}>+ Create a food manually</Text>
        </Pressable>

        <FootNote>Nutrition data from USDA FoodData Central (public domain) and Open Food Facts (ODbL).</FootNote>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  seg: { marginHorizontal: space.lg, marginVertical: space.md },
  ghostBtn: { alignItems: 'center', paddingVertical: 11, marginTop: 4 },
  ghostText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.coral },
});
