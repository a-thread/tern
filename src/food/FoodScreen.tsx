import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { colors, font, radius, space, tierColors } from '@shared/theme';
import { Group, GroupLabel, Chevron, FootNote } from '@shared/components/ui';
import type { RootStackParamList } from '@shared/navigation/types';
import { useDayKey } from '@shared/hooks/useDayKey';
import { formatLongDate } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { mealTotals, dayTotals, MEAL_OPTIONS, type FoodEntry } from './models';
import { useFood } from './FoodContext';
import { useFoodDisplay } from './useFoodDisplay';
import WaterCard from '@water/WaterCard';
import { useWater } from '@water/WaterContext';
import { TierDot } from './components';

export default function FoodScreen() {
  const todayKey = useDayKey();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { foodLog } = useFood();
  const { settings } = useSettings();
  const { showCalories } = useFoodDisplay();
  const water = useWater();
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
        <Text style={s.eyebrow}>{formatLongDate(todayKey)}</Text>
        <Text style={s.title}>Food</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 100,
        }}
      >
        <View style={s.statRow}>
          {/* With calorie tracking (or calorie numbers) off there is no calorie chip at all. */}
          {!showCalories ? null : settings.showRemainingVsTarget ? (
            <Stat
              value={Math.round(remainingCalories).toLocaleString()}
              label='left today'
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

        {water.enabled ? <WaterCard /> : null}

        {MEAL_OPTIONS.map(({ key, label }) => {
          const items = foodLog.filter((f) => f.meal === key);
          const cals = Math.round(mealTotals(foodLog, key));
          return (
            <View key={key}>
              <GroupLabel>{showCalories ? `${label} · ${cals}` : label}</GroupLabel>
              <Group>
                {[
                  ...items.map((item) => (
                    <FoodRow
                      key={item.id}
                      item={item}
                      showTiers={settings.showTiers}
                      showTierNumber={settings.showTierNumber}
                      showCalories={showCalories}
                      onPress={() =>
                        navigation.navigate('EditFood', { entryId: item.id })
                      }
                    />
                  )),
                  <AddRow
                    key='add'
                    onPress={() =>
                      navigation.navigate('LogFood', { meal: key })
                    }
                  />,
                  ...(items.length
                    ? [
                        <SaveMealRow
                          key='save'
                          onPress={() =>
                            navigation.navigate('SaveMeal', { meal: key })
                          }
                        />,
                      ]
                    : []),
                ]}
              </Group>
            </View>
          );
        })}

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
  onPress: () => void;
}) {
  return (
    <Pressable
      style={s.foodRow}
      android_ripple={{ color: colors.doveTint }}
      onPress={onPress}
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
      <Chevron />
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
