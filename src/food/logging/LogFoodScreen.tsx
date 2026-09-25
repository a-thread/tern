import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { useDayKey } from '@shared/hooks/useDayKey';
import { colors, font, radius, space, tierColors } from '@shared/theme';
import {
  Group,
  GroupLabel,
  SheetNav,
  FootNote,
  Chevron,
} from '@shared/components/ui';
import type { SearchResult } from '../searchData';
import { filterFoods } from '../recentFoods';
import { filterRecentMeals, type RecentMeal } from '../recentMeals';
import {
  useFoodSearch,
  offSource,
  usdaSource,
  SEARCH_MIN_CHARS,
} from '../useFoodSearch';
import { isUsdaEnabled } from '../usda';
import { useSavedMeals } from '../SavedMealsContext';
import { filterMeals, savedMealTotals, type SavedMeal } from '../savedMeals';
import { useLoggedFoods } from '../useLoggedFoods';
import { useSessionAdditions } from '../useSessionAdditions';
import { describeAdditions } from '../sessionAdditions';
import AddedBanner from './AddedBanner';
import { TierDot } from '../components';
import { useFoodDisplay } from '../useFoodDisplay';
import type { LogFoodStackParamList } from '../types';

type Props = NativeStackScreenProps<LogFoodStackParamList, 'Search'>;

const FILTERS = ['All', 'Meals', 'My foods', 'Recent'] as const;

export default function LogFoodScreen({ navigation, route }: Props) {
  // `pick`: choosing a food for a saved meal being built, not logging to today.
  const { meal, pick: pickMode } = route.params;
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const trimmed = query.trim();
  const searching = trimmed.length >= SEARCH_MIN_CHARS;

  const logged = useLoggedFoods();
  // Adding a food returns here, so confirm what went in and offer Done. (Not when
  // choosing foods for a saved meal: those go to the meal being edited.)
  const added = useSessionAdditions();
  const addedMessage = pickMode ? null : describeAdditions(added);
  const { meals: savedMeals, startDraft } = useSavedMeals();
  const yourMeals = useMemo(
    () => (pickMode ? [] : filterMeals(savedMeals, query)),
    [savedMeals, query, pickMode],
  );
  const filters = pickMode ? FILTERS.filter((f) => f !== 'Meals') : FILTERS;
  const today = useDayKey();
  // The meal you're adding to isn't offered back to you — it's the list you're
  // already looking at.
  const pastMeals = useMemo(
    () =>
      pickMode
        ? []
        : filterRecentMeals(
            logged.meals.filter((m) => !(m.day === today && m.meal === meal)),
            query,
          ),
    [logged.meals, query, pickMode, today, meal],
  );
  const mine = useMemo(() => filterFoods(logged.mine, query), [logged.mine, query]);
  const recent = useMemo(() => filterFoods(logged.recent, query), [logged.recent, query]);

  // Two food databases, searched independently: USDA for everyday foods (with
  // household portions; needs an API key) and Open Food Facts for packaged ones.
  const usdaOn = isUsdaEnabled();
  const everyday = useFoodSearch(query, filter === 'All' && usdaOn, usdaSource);
  const packaged = useFoodSearch(query, filter === 'All', offSource);
  const sources = [
    ...(usdaOn ? [{ label: 'USDA', ...everyday }] : []),
    { label: 'Open Food Facts', ...packaged },
  ];
  const loading = sources.some((x) => x.state.status === 'loading');
  const failed = sources.filter((x) => x.state.status === 'error');
  const retryFailed = () => failed.forEach((x) => x.retry());

  // Your own foods that match come first, then the databases' results without repeats.
  const yourMatches = searching ? mine.slice(0, 5) : [];
  const foodKey = (r: SearchResult) => `${r.name}|${r.brand ?? ''}`.toLowerCase();
  const yourKeys = new Set(yourMatches.map(foodKey));
  const fresh = (st: typeof everyday.state) =>
    st.status === 'done' ? st.results.filter((r) => !yourKeys.has(foodKey(r))) : [];
  const everydayResults = fresh(everyday.state);
  const packagedResults = fresh(packaged.state);
  const nothingFound =
    !loading &&
    !failed.length &&
    !yourMeals.length &&
    !yourMatches.length &&
    !everydayResults.length &&
    !packagedResults.length;

  // Every result carries nutrition (results without it are filtered out), so
  // it always goes to the details screen; only a missing food type is asked for there.
  const pick = (result: SearchResult) =>
    navigation.navigate('FoodDetail', { meal, result, pick: pickMode });
  const newMeal = () => {
    startDraft();
    navigation.navigate('MealEditor');
  };
  const openMeal = (m: SavedMeal) =>
    navigation.navigate('SavedMeal', { meal, mealId: m.id });
  const openPastMeal = (m: RecentMeal) =>
    navigation.navigate('RecentMeal', { meal, recentId: m.id });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title={pickMode ? 'Add food to meal' : `Add to ${meal}`}
        leftLabel={addedMessage ? 'Done' : 'Cancel'}
        onLeftPress={() =>
          pickMode ? navigation.goBack() : navigation.getParent()?.goBack()
        }
      />

      <View style={s.searchBar}>
        <Svg
          width={15}
          height={15}
          viewBox='0 0 24 24'
          fill='none'
          stroke={colors.ink3}
          strokeWidth={2.5}
        >
          <Path d='M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4' />
        </Svg>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder='Search foods'
          placeholderTextColor={colors.ink3}
          style={s.searchInput}
          autoFocus
        />
        <Pressable
          style={s.scanBtn}
          onPress={() =>
            navigation.navigate('BarcodeScan', { meal, pick: pickMode })
          }
        >
          <Svg
            width={15}
            height={15}
            viewBox='0 0 24 24'
            fill='none'
            stroke='#fff'
            strokeWidth={2}
          >
            <Path d='M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M6 12h12' />
          </Svg>
        </Pressable>
      </View>

      <View style={s.seg}>
        {filters.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[s.segItem, filter === f && s.segOn]}
          >
            <Text style={[s.segText, filter === f && s.segTextOn]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {addedMessage ? <AddedBanner message={addedMessage} /> : null}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps='handled'
      >
        {filter === 'All' ? (
          <>
            {!searching ? (
              <>
                {yourMeals.length ? (
                  <MealGroup label='Your meals' meals={yourMeals} onPick={openMeal} />
                ) : null}
                {pastMeals.length ? (
                  <RecentMealGroup
                    label='Recent meals'
                    meals={pastMeals.slice(0, 5)}
                    onPick={openPastMeal}
                  />
                ) : null}
                {recent.length ? (
                  <FoodGroup label='Logged recently' foods={recent} onPick={pick} />
                ) : null}
                {!yourMeals.length && !pastMeals.length && !recent.length ? (
                  <Note>
                    Search foods above, or scan a barcode. Foods you log will show
                    up here for next time.
                  </Note>
                ) : null}
              </>
            ) : (
              <>
                {yourMeals.length ? (
                  <MealGroup label='Your meals' meals={yourMeals.slice(0, 5)} onPick={openMeal} />
                ) : null}
                {yourMatches.length ? (
                  <FoodGroup label='Your foods' foods={yourMatches} onPick={pick} />
                ) : null}
                {everydayResults.length ? (
                  <FoodGroup label='Everyday foods' foods={everydayResults} onPick={pick} />
                ) : null}
                {packagedResults.length ? (
                  <FoodGroup label='Packaged' foods={packagedResults} onPick={pick} />
                ) : null}
                {loading ? (
                  <View style={s.status}>
                    <ActivityIndicator color={colors.ink3} />
                    <Text style={s.statusText}>Searching…</Text>
                  </View>
                ) : null}
                {failed.length ? (
                  <View style={s.errorCard}>
                    <Text style={s.errorTitle}>
                      {failed.length === sources.length
                        ? "Couldn't search the food databases"
                        : `Couldn't reach ${failed.map((x) => x.label).join(' or ')}`}
                    </Text>
                    <Text style={s.statusText}>
                      {failed.length === sources.length
                        ? 'Check your connection, or add the food yourself below.'
                        : 'Showing what the other database found.'}
                    </Text>
                    <Pressable onPress={retryFailed} hitSlop={8}>
                      <Text style={s.retry}>Try again</Text>
                    </Pressable>
                  </View>
                ) : null}
                {nothingFound ? (
                  <Note>No matches for “{trimmed}”. Try fewer words, or create it below.</Note>
                ) : null}
              </>
            )}
          </>
        ) : null}

        {filter === 'Meals' ? (
          <>
            <Pressable style={s.newMeal} onPress={newMeal}>
              <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
                <Path d='M12 5v14M5 12h14' stroke={colors.coral} strokeWidth={3} strokeLinecap='round' />
              </Svg>
              <Text style={s.newMealText}>New meal</Text>
            </Pressable>
            {yourMeals.length ? (
              <MealGroup label='Your meals' meals={yourMeals} onPick={openMeal} />
            ) : null}
            {pastMeals.length ? (
              <RecentMealGroup
                label='Recent meals'
                meals={pastMeals}
                onPick={openPastMeal}
              />
            ) : null}
            {!yourMeals.length && !pastMeals.length ? (
              <Note>
                {trimmed
                  ? `Nothing matches “${trimmed}”.`
                  : 'Build a meal with New meal, or log a few foods and choose “Save as meal” on the Food tab. Meals you log show up here too.'}
              </Note>
            ) : null}
          </>
        ) : null}

        {filter === 'My foods' ? (
          mine.length ? (
            <FoodGroup label='My foods' foods={mine} onPick={pick} />
          ) : (
            <Note>
              {trimmed
                ? `None of your foods match “${trimmed}”.`
                : 'Foods you log will show up here.'}
            </Note>
          )
        ) : null}

        {filter === 'Recent' ? (
          recent.length ? (
            <FoodGroup label='Logged recently' foods={recent} onPick={pick} />
          ) : (
            <Note>
              {trimmed
                ? `Nothing recent matches “${trimmed}”.`
                : 'Nothing logged in the last two weeks.'}
            </Note>
          )
        ) : null}

        <Pressable
          onPress={() =>
            navigation.navigate('ManualFoodEntry', { meal, pick: pickMode })
          }
          style={s.ghostBtn}
        >
          <Text style={s.ghostText}>+ Create a food manually</Text>
        </Pressable>

        <FootNote>
          Nutrition data from Open Food Facts (ODbL) and USDA FoodData Central.
        </FootNote>
      </ScrollView>
    </View>
  );
}

function FoodGroup({
  label,
  foods,
  onPick,
}: {
  label: string;
  foods: SearchResult[];
  onPick: (r: SearchResult) => void;
}) {
  return (
    <>
      <GroupLabel>{label}</GroupLabel>
      <Group>
        {foods.map((r) => (
          <ResultRow key={r.id} result={r} onPress={() => onPick(r)} />
        ))}
      </Group>
    </>
  );
}

function MealGroup({
  label,
  meals,
  onPick,
}: {
  label: string;
  meals: SavedMeal[];
  onPick: (m: SavedMeal) => void;
}) {
  return (
    <>
      <GroupLabel>{label}</GroupLabel>
      <Group>
        {meals.map((m) => (
          <MealRow key={m.id} meal={m} onPress={() => onPick(m)} />
        ))}
      </Group>
    </>
  );
}

function RecentMealGroup({
  label,
  meals,
  onPick,
}: {
  label: string;
  meals: RecentMeal[];
  onPick: (m: RecentMeal) => void;
}) {
  return (
    <>
      <GroupLabel>{label}</GroupLabel>
      <Group>
        {meals.map((m) => (
          <RecentMealRow key={m.id} meal={m} onPress={() => onPick(m)} />
        ))}
      </Group>
    </>
  );
}

/** A meal from a past day: the day and meal it was, and what was in it. */
function RecentMealRow({ meal, onPress }: { meal: RecentMeal; onPress: () => void }) {
  const { showCalories } = useFoodDisplay();
  const cals = Math.round(savedMealTotals(meal.items).calories);
  const n = meal.items.length;
  const names = meal.items.map((i) => i.name).join(', ');
  return (
    <Pressable style={s.row} android_ripple={{ color: colors.doveTint }} onPress={onPress}>
      <View style={s.mealIcon}>
        <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
          <Path
            d='M12 3a9 9 0 1 0 9 9M12 7v5l3 2'
            stroke={colors.ink2}
            strokeWidth={2.2}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{meal.title}</Text>
        <Text style={s.rowSub} numberOfLines={1}>
          {showCalories ? `${cals} cal · ` : `${n} ${n === 1 ? 'food' : 'foods'} · `}
          {names}
        </Text>
      </View>
      <Chevron />
    </Pressable>
  );
}

function MealRow({ meal, onPress }: { meal: SavedMeal; onPress: () => void }) {
  const { showCalories } = useFoodDisplay();
  const cals = Math.round(savedMealTotals(meal.items).calories);
  const n = meal.items.length;
  return (
    <Pressable style={s.row} android_ripple={{ color: colors.doveTint }} onPress={onPress}>
      <View style={s.mealIcon}>
        <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
          <Path d='M6 3h12v18l-6-4-6 4V3z' stroke={colors.ink2} strokeWidth={2.2} strokeLinejoin='round' />
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{meal.name}</Text>
        <Text style={s.rowSub}>
          {n} {n === 1 ? 'food' : 'foods'}
          {showCalories ? ` · ${cals} cal` : ''}
        </Text>
      </View>
      <Chevron />
    </Pressable>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <Text style={s.note}>{children}</Text>;
}

function ResultRow({
  result,
  onPress,
}: {
  result: SearchResult;
  onPress: () => void;
}) {
  const unknown = result.tier === null; // food type not known; nutrition always is
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();
  const brandPrefix = result.brand ? result.brand + ' · ' : '';
  const detail = showCalories
    ? `${brandPrefix}${result.calories} cal / ${result.servingLabel}`
    : `${brandPrefix}${result.servingLabel}`;
  return (
    <Pressable
      style={s.row}
      android_ripple={{ color: colors.doveTint }}
      onPress={onPress}
    >
      {!showTiers ? null : unknown ? (
        <View style={[s.tierUnknown]}>
          <Text style={s.tierUnknownText}>?</Text>
        </View>
      ) : (
        <TierDot
          tier={result.tier as number}
          color={tierColors[result.tier as 1 | 2 | 3 | 4]}
          showNumber={showTierNumber}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{result.name}</Text>
        <Text style={s.rowSub}>{detail}</Text>
      </View>
      <View style={s.plusBtn}>
        <Svg
          width={12}
          height={12}
          viewBox='0 0 24 24'
          fill='none'
          stroke={colors.coral}
          strokeWidth={3}
        >
          <Path d='M12 5v14M5 12h14' />
        </Svg>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  note: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 19,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: space.lg,
  },
  statusText: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  errorCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    marginTop: space.md,
    gap: 4,
  },
  errorTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  retry: { fontFamily: font.semibold, fontSize: 13, color: colors.ink, marginTop: 6 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8E5DD',
    borderRadius: radius.md - 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: space.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 14,
    color: colors.ink,
    padding: 0,
  },
  scanBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seg: {
    flexDirection: 'row',
    backgroundColor: '#E8E5DD',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: space.lg,
    marginVertical: space.md,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  segOn: { backgroundColor: '#fff' },
  segText: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  segTextOn: { fontFamily: font.semibold, color: colors.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  rowTitle: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  rowSub: {
    fontFamily: font.body,
    fontSize: 11.5,
    color: colors.ink2,
    marginTop: 1,
  },
  plusBtn: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: colors.coralTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginTop: space.md,
  },
  newMealText: { fontFamily: font.semibold, fontSize: 14, color: colors.coral },
  mealIcon: {
    width: 19,
    height: 19,
    borderRadius: 6,
    backgroundColor: colors.doveTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierUnknown: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.dove,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierUnknownText: { fontFamily: font.bold, fontSize: 9.5, color: '#4A4A4A' },
  ghostBtn: { alignItems: 'center', paddingVertical: 11, marginTop: 4 },
  ghostText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.coral },
});
