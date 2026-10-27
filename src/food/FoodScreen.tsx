import React from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  font,
  radius,
  space,
  tierColors,
  typography,
} from '@shared/theme';
import {
  Group,
  GroupLabel,
  FootNote,
  Chevron,
  Icon,
} from '@shared/components/ui';
import { SwipeToRemove } from './components/SwipeToRemove/SwipeToRemove';
import { DaySwitcher } from './components/DaySwitcher/DaySwitcher';
import { TabHeader } from '@shared/components/TabHeader/TabHeader';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { usePullToRefresh } from '@shared/hooks/usePullToRefresh';
import { useToast } from '@shared/state/ToastContext';
import { useSettings } from '../domain/settings/SettingsContext';
import { mealTotals, Meals } from '../domain/food/models/meals';
import { type FoodEntry } from '../domain/food/models/foodEntry';
import { useFood } from '../domain/food/FoodContext';
import { useFoodDisplay } from '../domain/food/hooks/useFoodDisplay';
import WaterCard from '@shared/components/WaterCard/WaterCard';
import { useWater } from '../domain/water/WaterContext';
import { useMealCheckIns } from '../domain/meal-check-ins/MealCheckInsContext';
import { MealCheckInRow } from './components/MealCheckInRow/MealCheckInRow';
import { TierDot } from '@shared/components/TierDot';
import { IntakeBars } from '@shared/components/IntakeBars/IntakeBars';
import { useRootNavigation } from '../navigation/useAppNavigation';
import { TipOverlay } from '@shared/components/TipOverlay/TipOverlay';
import { useFoodTips } from './hooks/useFoodTips';

export default function FoodScreen() {
  // Today unless a past day was picked on Home; yesterday can still be filled in.
  const { day, isToday, editable, showToday } = useViewedDay();
  const when = isToday ? 'today' : 'yesterday';
  const insets = useSafeAreaInsets();
  const navigation = useRootNavigation();
  const {
    foodLog,
    skippedMeals,
    loadedDay,
    setMealSkipped,
    removeFoodEntry,
    addFoodEntry,
    reload: reloadFood,
  } = useFood();
  const dayLoaded = loadedDay === day;
  const { settings } = useSettings();
  const { showCalories } = useFoodDisplay();
  const water = useWater();
  const mealCheckIns = useMealCheckIns();
  const refreshControl = usePullToRefresh([
    reloadFood,
    water.reload,
    mealCheckIns.reload,
  ]);
  const toast = useToast();
  const tips = useFoodTips();

  // A swipe removes at once, so the toast offers it back (as a new entry in the same meal).
  const removeWithUndo = ({ id, ...entry }: FoodEntry) => {
    removeFoodEntry(id);
    toast.show(`Removed ${entry.name}`, {
      label: 'Undo',
      onPress: () => addFoodEntry(entry),
    });
  };

  return (
    <View
      ref={tips.rootRef}
      collapsable={false}
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <TabHeader
        eyebrow={<DaySwitcher />}
        title='Food'
        accessory={
          isToday ? null : (
            <Pressable
              onPress={showToday}
              hitSlop={8}
              style={s.backChip}
              accessibilityRole='button'
            >
              <Text style={s.backText}>Back to today</Text>
            </Pressable>
          )
        }
      />

      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: space.lg,
        }}
      >
        <IntakeBars />

        {water.enabled ? <WaterCard /> : null}

        {!dayLoaded ? (
          // Another day's food never shows under this day's date while it loads.
          <ActivityIndicator
            color={colors.ink3}
            style={{ marginTop: space.xl }}
          />
        ) : !editable && !foodLog.length && !skippedMeals.length ? (
          <FootNote>Nothing logged this day.</FootNote>
        ) : (
          Meals.OPTIONS.map(({ key, label }) => {
            const items = foodLog.filter((f) => f.meal === key);
            const cals = Math.round(mealTotals(foodLog, key));
            const core = Meals.CORE.includes(key);
            const skipped = skippedMeals.includes(key);
            const name = label.toLowerCase();
            // A meal with food in it can be checked in on (a past day shows only one that was).
            const showCheckIn =
              mealCheckIns.enabled &&
              items.length > 0 &&
              (editable || mealCheckIns.forMeal(key) !== undefined);
            // Before yesterday a day is only looked at: meals with nothing in them are left out.
            if (!editable && !items.length && !skipped) return null;
            return (
              <View key={key}>
                <GroupLabel>
                  {showCalories ? `${label} · ${cals}` : label}
                </GroupLabel>
                <Group>
                  {[
                    ...(skipped && !items.length
                      ? [
                          editable ? (
                            <SkippedRow
                              key='skipped'
                              text={`No ${name} ${when}`}
                              onUndo={() => setMealSkipped(key, false)}
                            />
                          ) : (
                            <SkippedRow key='skipped' text={`No ${name}`} />
                          ),
                        ]
                      : []),
                    ...items.map((item) =>
                      editable ? (
                        // The first food is where the swipe tip points.
                        <View
                          key={item.id}
                          ref={
                            item.id === tips.firstFoodId
                              ? tips.firstFoodRef
                              : undefined
                          }
                          collapsable={false}
                        >
                          <SwipeToRemove onRemove={() => removeWithUndo(item)}>
                            <FoodRow
                              item={item}
                              showTiers={settings.showTiers}
                              showTierNumber={settings.showTierNumber}
                              showCalories={showCalories}
                              onPress={() =>
                                navigation.navigate('EditFood', {
                                  entryId: item.id,
                                })
                              }
                            />
                          </SwipeToRemove>
                        </View>
                      ) : (
                        <FoodRow
                          key={item.id}
                          item={item}
                          showTiers={settings.showTiers}
                          showTierNumber={settings.showTierNumber}
                          showCalories={showCalories}
                        />
                      ),
                    ),
                    ...(showCheckIn
                      ? [<MealCheckInRow key='check-in' meal={key} />]
                      : []),
                    ...(editable
                      ? [
                          <AddRow
                            key='add'
                            onPress={() =>
                              navigation.navigate('LogFood', { meal: key })
                            }
                          />,
                        ]
                      : []),
                    ...(!editable
                      ? []
                      : items.length
                        ? [
                            <SaveMealRow
                              key='save'
                              onPress={() =>
                                navigation.navigate('SaveMeal', { meal: key })
                              }
                            />,
                          ]
                        : core && !skipped
                          ? [
                              // The first open meal's is where the "counts as logged" tip points.
                              <View
                                key='skip'
                                ref={
                                  key === tips.skipMeal
                                    ? tips.skipMealRef
                                    : undefined
                                }
                                collapsable={false}
                              >
                                <SkipMealRow
                                  text={`No ${name} ${when}`}
                                  onPress={() => setMealSkipped(key, true)}
                                />
                              </View>,
                            ]
                          : []),
                  ]}
                </Group>
              </View>
            );
          })
        )}

        {settings.showTiers ? (
          <FootNote>
            Numbers show processing level (NOVA), not a judgment about what to
            eat. Nutrition data from USDA FoodData Central and Open Food Facts.
          </FootNote>
        ) : (
          <FootNote>
            Nutrition data from USDA FoodData Central and Open Food Facts.
          </FootNote>
        )}
      </ScrollView>

      {tips.shown && tips.text ? (
        <TipOverlay
          rect={tips.shown.rect}
          lead={tips.text.lead}
          rest={tips.text.rest}
          position={tips.shown.position}
          total={tips.shown.total}
          onGotIt={tips.gotIt}
          onSkip={tips.skipAll}
        />
      ) : null}
    </View>
  );
}

function FoodRow({
  item,
  showTiers,
  showTierNumber,
  showCalories,
  onPress,
}: {
  item: FoodEntry;
  showTiers: boolean;
  showTierNumber: boolean;
  showCalories: boolean;
  /** Leave out on a day that can only be looked at. */
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={s.foodRow}
      android_ripple={onPress ? { color: colors.doveTint } : undefined}
      onPress={onPress}
      disabled={!onPress}
    >
      {showTiers ? (
        <TierDot
          tier={item.tier}
          color={tierColors[item.tier]}
          showNumber={showTierNumber}
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={s.foodName}>{item.name}</Text>
        <Text style={s.foodSub}>
          {item.servings === 1
            ? item.servingLabel
            : `${item.servings} × ${item.servingLabel}`}
          {item.tierOverridden ? ' · custom' : ''}
        </Text>
      </View>
      {showCalories ? (
        <Text style={s.foodCals}>
          {Math.round(item.calories * item.servings)}
        </Text>
      ) : null}
      {onPress ? <Chevron /> : null}
    </Pressable>
  );
}

function AddRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={s.foodRow}
      android_ripple={{ color: colors.coralTint }}
      onPress={onPress}
    >
      <Icon name='plus' size={15} color={colors.coral} />
      <Text style={[s.foodName, { color: colors.coral }]}>Add food</Text>
    </Pressable>
  );
}

/** A quiet row under a meal's foods for keeping them as a reusable saved meal. */
function SaveMealRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={s.foodRow}
      android_ripple={{ color: colors.doveTint }}
      onPress={onPress}
    >
      <Icon name='bookmark-outline' size={15} color={colors.ink2} />
      <Text style={[s.foodName, { color: colors.ink2 }]}>Save as meal</Text>
    </Pressable>
  );
}

/**
 * Marks an empty core meal as "nothing today". It counts toward "logging all
 * meals" exactly like food does, so a complete log never means eating more.
 */
function SkipMealRow({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable
      style={s.foodRow}
      android_ripple={{ color: colors.doveTint }}
      onPress={onPress}
      accessibilityRole='button'
    >
      <Icon name='minus' size={15} color={colors.ink2} />
      <Text style={[s.foodName, { color: colors.ink2 }]}>{text}</Text>
    </Pressable>
  );
}

function SkippedRow({ text, onUndo }: { text: string; onUndo?: () => void }) {
  return (
    <View style={s.foodRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.foodName}>{text}</Text>
        <Text style={s.foodSub}>Counts as logged</Text>
      </View>
      {onUndo ? (
        <Pressable onPress={onUndo} hitSlop={8} accessibilityRole='button'>
          <Text style={[s.foodCals, { color: colors.coral }]}>Undo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  backChip: {
    backgroundColor: colors.coralTint,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backText: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  foodName: typography.rowTitle,
  foodSub: { ...typography.small, marginTop: 1 },
  foodCals: typography.caption,
});
