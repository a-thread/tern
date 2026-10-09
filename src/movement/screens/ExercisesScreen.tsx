import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, radius, space } from '@shared/theme';
import { FootNote, Group, GroupLabel, Row, SheetNav, Icon } from '@shared/components/ui';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { useUnits } from '@settings/hooks/useUnits';
import { useMovement } from '@movement/MovementContext';
import { ActivityGlyph } from '@movement/components/ActivityGlyph';
import type { MovementStackParamList } from '@movement/navigation';
import {
  ACTIVITY_INFO,
  EFFORT_LABEL,
  entriesOn,
  formatDistance,
  isLoggableDay,
  searchActivities,
} from '@movement/models/movementEntry';

type Props = NativeStackScreenProps<MovementStackParamList, 'Exercises'>;

/**
 * Log movement: what's already logged for the day (with Remove for entries
 * logged here), then the list of exercises to choose from, with a search.
 */
export default function ExercisesScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const today = useDayKey();
  const day = route.params?.day ?? today;
  const { entries, remove } = useMovement();
  const { units } = useUnits();
  const [query, setQuery] = useState('');

  const logged = entriesOn(entries, day);
  const canLog = isLoggableDay(day, today);
  const title = day === today ? 'Log movement' : day === addDays(today, -1) ? "Yesterday's movement" : 'Movement';
  const list = searchActivities(query);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <SheetNav title={title} leftLabel='Done' onLeftPress={() => navigation.getParent()?.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 40 }} keyboardShouldPersistTaps='handled'>
        {logged.length ? (
          <>
            <GroupLabel>Logged</GroupLabel>
            <Group>
              {logged.map((e) => (
                <Row
                  key={e.id}
                  icon={<ActivityGlyph activity={e.activity} />}
                  title={ACTIVITY_INFO[e.activity].label}
                  sub={[
                    `${e.minutes} min`,
                    e.effort ? `${EFFORT_LABEL[e.effort].toLowerCase()} intensity` : null,
                    e.distanceM ? formatDistance(e.distanceM, units) : null,
                    e.source === 'healthConnect' ? 'Health Connect' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  right={
                    e.source === 'manual' && canLog ? (
                      <Pressable onPress={() => remove(e.id)} hitSlop={8} accessibilityRole='button' accessibilityLabel={`Remove ${ACTIVITY_INFO[e.activity].label}`}>
                        <Text style={s.remove}>Remove</Text>
                      </Pressable>
                    ) : undefined
                  }
                />
              ))}
            </Group>
          </>
        ) : null}

        {canLog ? (
          <>
            <View style={s.search}>
              <Icon name='magnify' size={17} color={colors.ink3} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder='Search exercises'
                placeholderTextColor={colors.ink3}
                style={s.input}
              />
            </View>

            <GroupLabel>Exercise</GroupLabel>
            {list.length ? (
              <Group>
                {list.map((a) => (
                  <Row
                    key={a}
                    icon={<ActivityGlyph activity={a} />}
                    title={ACTIVITY_INFO[a].label}
                    chevron
                    onPress={() => navigation.navigate('ExerciseDetail', { activity: a, day })}
                  />
                ))}
              </Group>
            ) : (
              <FootNote>{`Nothing matches "${query.trim()}". Try "Other".`}</FootNote>
            )}
            <FootNote>
              Walking, running, hiking and stairs are already in your steps, so they're logged but don't
              add to a goal day.
            </FootNote>
          </>
        ) : (
          <FootNote>Movement can be logged for today and yesterday.</FootNote>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  remove: { fontFamily: font.semibold, fontSize: 12.5, color: colors.coral },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.track,
    borderRadius: radius.md - 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: space.md,
  },
  input: { flex: 1, fontFamily: font.body, fontSize: 14, color: colors.ink, padding: 0 },
});
