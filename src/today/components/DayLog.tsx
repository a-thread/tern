import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font, radius, space, tierColors } from '@shared/theme';
import { Group, GroupLabel, FootNote } from '@shared/components/ui';
import type { RootStackParamList } from '@shared/navigation/types';
import { DayState } from '@shared/models/dayState';
import { dayKey, formatLongDate, weekdayName } from '@shared/utils/date';
import { pointsFor, WaypointSource } from '@journey/models/waypoint';
import { useSettings } from '@settings/SettingsContext';
import { useUnits } from '@settings/hooks/useUnits';
import { useFood } from '@food/FoodContext';
import { useFoodDisplay } from '@food/hooks/useFoodDisplay';
import { TierDot } from '@food/components/TierDot';
import { dayTotals, type FoodEntry } from '@food/models/foodEntry';
import { mealTotals, Meals } from '@food/models/meals';
import { useWeight } from '@weight/WeightContext';
import type { DayRecord } from '@today/models/dayRecord';
import { useDayKey } from '@shared/hooks/useDayKey';
import { useMovement } from '@movement/MovementContext';
import { MovementSheet } from '@movement/components/MovementSheet';
import {
  ACTIVITY_LABEL,
  EFFORT_LABEL,
  entriesOn,
  isLoggableDay,
} from '@movement/models/movementEntry';

const REST_DAY_POINTS = pointsFor(WaypointSource.Rest);

/** What was logged on a past day: its steps, weight and meals, read-only. */
export function DayLog({ record }: { record: DayRecord }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings } = useSettings();
  const { loadHistory } = useFood();
  const { showTiers, showTierNumber, showCalories } = useFoodDisplay();
  const { weightEntries } = useWeight();
  const { formatWeight } = useUnits();
  const [entries, setEntries] = useState<FoodEntry[] | null>(null);
  const movement = useMovement();
  const today = useDayKey();
  const [movementOpen, setMovementOpen] = useState(false);
  const moved = entriesOn(movement.entries, record.day);
  const loggable = isLoggableDay(record.day, today);
  const movedMinutes = moved.reduce((s, e) => s + e.minutes, 0);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    loadHistory(record.day, record.day)
      .then((h) => !cancelled && setEntries(h[record.day] ?? []))
      .catch((e) => {
        console.warn('Could not load the day', e);
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [loadHistory, record.day]);

  const weighIn = weightEntries.find(
    (e) => dayKey(new Date(e.loggedAt)) === record.day,
  );
  const totals = dayTotals(entries ?? []);
  const empty = entries !== null && entries.length === 0;

  return (
    <View>
      <GroupLabel>{formatLongDate(record.day)}</GroupLabel>

      <View style={s.statRow}>
        {settings.trackCalories && showCalories ? (
          <Stat
            value={Math.round(totals.calories).toLocaleString()}
            label='calories'
          />
        ) : null}
        <Stat
          value={record.steps.toLocaleString()}
          label={`of ${record.goal.toLocaleString()} steps`}
        />
        {movement.enabled && movedMinutes > 0 ? (
          <Stat value={`${movedMinutes}`} label='min moved' />
        ) : null}
        {weighIn ? <Stat value={formatWeight(weighIn.lb)} label='weight' /> : null}
      </View>

      {movement.enabled && (moved.length || loggable) ? (
        <>
          <GroupLabel>Movement</GroupLabel>
          <Group>
            {[
              ...moved.map((e) => (
                <View key={e.id} style={s.foodRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.foodName}>{ACTIVITY_LABEL[e.activity]}</Text>
                    <Text style={s.foodSub}>
                      {[`${e.minutes} min`, e.effort ? EFFORT_LABEL[e.effort].toLowerCase() : null, e.source === 'healthConnect' ? 'Health Connect' : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </View>
              )),
              ...(loggable
                ? [
                    <Pressable key='log' style={s.foodRow} onPress={() => setMovementOpen(true)} accessibilityRole='button'>
                      <Text style={[s.foodName, { color: colors.coral }]}>
                        {moved.length ? 'Edit movement' : 'Log movement'}
                      </Text>
                    </Pressable>,
                  ]
                : []),
            ]}
          </Group>
          {record.movedToGoal ? <Text style={s.note}>A goal day by movement.</Text> : null}
          <MovementSheet visible={movementOpen} onClose={() => setMovementOpen(false)} day={record.day} />
        </>
      ) : null}

      {record.state === DayState.Rest ? (
        <Pressable
          onPress={() =>
            navigation.navigate('RestDay', {
              dayName: weekdayName(record.day),
              steps: record.steps,
              waypoints: REST_DAY_POINTS,
            })
          }
          hitSlop={8}
        >
          <Text style={s.note}>Rest day · see details</Text>
        </Pressable>
      ) : record.state === DayState.Frozen ? (
        <Text style={s.note}>
          A streak freeze covered this day, so your streak carried on.
        </Text>
      ) : null}

      {empty ? (
        <FootNote>Nothing logged this day.</FootNote>
      ) : (
        Meals.OPTIONS.map(({ key, label }) => {
          const items = (entries ?? []).filter((f) => f.meal === key);
          if (!items.length) return null;
          const cals = Math.round(mealTotals(entries ?? [], key));
          return (
            <View key={key}>
              <GroupLabel>
                {showCalories ? `${label} · ${cals}` : label}
              </GroupLabel>
              <Group>
                {items.map((item) => (
                  <View key={item.id} style={s.foodRow}>
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
                      </Text>
                    </View>
                    {showCalories ? (
                      <Text style={s.foodCals}>
                        {Math.round(item.calories * item.servings)}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Group>
            </View>
          );
        })
      )}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: 7 },
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
  note: {
    fontFamily: font.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.driftwood,
    textAlign: 'center',
    marginTop: space.sm,
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
