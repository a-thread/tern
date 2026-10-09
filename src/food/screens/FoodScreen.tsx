import React from 'react';
import { ActivityIndicator, View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space, tierColors } from '@shared/theme';
import {
  Group,
  GroupLabel,
  Chevron,
  FootNote,
  SwipeToRemove,
} from '@shared/components/ui';
import type { RootStackParamList } from '@shared/navigation/types';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { usePullToRefresh } from '@shared/hooks/usePullToRefresh';
import { formatLongDate } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { mealTotals, Meals } from '@food/models/meals';
import { dayTotals, type FoodEntry } from '@food/models/foodEntry';
import { useFood } from '@food/FoodContext';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import WaterCard from '@water/components/WaterCard';
import { useWater } from '@water/WaterContext';
import { TierDot } from '@food/components/TierDot';
import { IntakeBarometer } from '@food/components/IntakeBarometer';

export default function FoodScreen() {
  // Today unless a past day was picked on Home; yesterday can still be filled in.
  const { day, isToday, editable, showToday } = useViewedDay();
  const when = isToday ? 'today' : 'yesterday';
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { foodLog, skippedMeals, loadedDay, setMealSkipped, removeFoodEntry, reload: reloadFood } =
    useFood();
  const dayLoaded = loadedDay === day;
  const { settings } = useSettings();
  const { showCalories } = useFoodDisplay();
  const water = useWater();
  const refreshControl = usePullToRefresh([reloadFood, water.reload]);
  const totals = dayTotals(foodLog);
  const remainingCalories = Math.max(
    settings.calorieTarget - totals.calories,
    0,
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Text style={s.eyebrow}>{formatLongDate(day)}</Text>
        <View style={s.titleRow}>
          <Text style={s.title}>Food</Text>
          {isToday ? null : (
            <Pressable onPress={showToday} hitSlop={8} style={s.backChip} accessibilityRole='button'>
              <Text style={s.backText}>Back to today</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 100,
        }}
      >
        {settings.showIntakeBars && settings.trackCalories ? (
          <IntakeBarometer totals={totals} entries={foodLog} />
        ) : (
        <View style={s.statRow}>
          {/* With calorie tracking (or calorie numbers) off there is no calorie chip at all. */}
          {!showCalories ? null : settings.showRemainingVsTarget ? (
            <Stat
              value={Math.round(remainingCalories).toLocaleString()}
              label={isToday ? 'left today' : 'left'}
            />
          ) : (
            <Stat
              value={Math.round(totals.calories).toLocaleString()}
              label='calories'
            />
          )}
          <Stat
            value={`${Math.round(totals.protein)}g`}
            label='protein'
            color={colors.kelp}
          />
          <Stat
            value={`${Math.round(totals.fat)}g`}
            label='fat'
            color={colors.sunDeep}
          />
        </View>
        )}

        {water.enabled ? <WaterCard /> : null}

        {!dayLoaded ? (
          // Another day's food never shows under this day's date while it loads.
          <ActivityIndicator color={colors.ink3} style={{ marginTop: space.xl }} />
        ) : !editable && !foodLog.length && !skippedMeals.length ? (
          <FootNote>Nothing logged this day.</FootNote>
        ) : (
          Meals.OPTIONS.map(({ key, label }) => {
            const items = foodLog.filter((f) => f.meal === key);
            const cals = Math.round(mealTotals(foodLog, key));
            const core = Meals.CORE.includes(key);
            const skipped = skippedMeals.includes(key);
            const name = label.toLowerCase();
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
                        <SwipeToRemove
                          key={item.id}
                          onRemove={() => removeFoodEntry(item.id)}
                        >
                          <FoodRow
                            item={item}
                            showTiers={settings.showTiers}
                            showTierNumber={settings.showTierNumber}
                            showCalories={showCalories}
                            onPress={() =>
                              navigation.navigate('EditFood', { entryId: item.id })
                            }
                          />
                        </SwipeToRemove>
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
                              <SkipMealRow
                                key='skip'
                                text={`No ${name} ${when}`}
                                onPress={() => setMealSkipped(key, true)}
                              />,
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
            eat. Data from Open Food Facts.
          </FootNote>
        ) : (
          <FootNote>Nutrition data from Open Food Facts.</FootNote>
        )}
      </ScrollView>
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
      <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
        <Path
          d='M12 5v14M5 12h14'
          stroke={colors.coral}
          strokeWidth={3}
          strokeLinecap='round'
        />
      </Svg>
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
      <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
        <Path
          d='M6 3h12v18l-6-4-6 4V3z'
          stroke={colors.ink2}
          strokeWidth={2.2}
          strokeLinejoin='round'
        />
      </Svg>
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
      <Svg width={13} height={13} viewBox='0 0 24 24' fill='none'>
        <Path
          d='M5 12h14'
          stroke={colors.ink2}
          strokeWidth={2.4}
          strokeLinecap='round'
        />
      </Svg>
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

function Stat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  eyebrow: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backChip: {
    backgroundColor: colors.coralTint,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backText: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
  title: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  statRow: { flexDirection: 'row', gap: 7, marginTop: space.xs },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  statLabel: {
    fontFamily: font.body,
    fontSize: 9.5,
    color: colors.ink2,
    marginTop: 1,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  foodName: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  foodSub: {
    fontFamily: font.body,
    fontSize: 11,
    color: colors.ink2,
    marginTop: 1,
  },
  foodCals: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2 },
});
