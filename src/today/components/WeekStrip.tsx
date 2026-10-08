import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { DayRing } from '@shared/components/charts/DayRing';
import { useDayKey } from '@shared/hooks/useDayKey';
import { weekdayLetter } from '@shared/utils/date';
import { useSettings } from '@settings/SettingsContext';
import { useActivity } from '@today/ActivityContext';
import { factForDay } from '@today/utils/ternFacts';
import { DayState } from '@shared/models/dayState';
import { StepsStatus } from '@today/data/steps.repository';

/**
 * This week's seven rings, a fact for the day, and the rest-day link. Tapping a
 * day that has happened selects it (`onSelect`); the screen shows its log below.
 */
export function WeekStrip({
  replayKey,
  selectedDay,
  onSelect,
}: {
  replayKey: number;
  selectedDay: string;
  onSelect: (day: string) => void;
}) {
  const todayKey = useDayKey();
  const { settings } = useSettings();
  const { week, todaySteps, status, restLeft, todayIsRest, takeRestDay, undoRestDay } = useActivity();
  const reached = todaySteps / settings.stepGoal >= 1;

  return (
    <>
      <View style={s.weekRow}>
        {week.map((d, i) => (
          <Pressable
            key={d.day}
            onPress={() => onSelect(d.day)}
            disabled={d.future}
            accessibilityRole='button'
            accessibilityState={{ selected: d.day === selectedDay }}
          >
            <DayRing
              progress={d.goal > 0 ? Math.min(d.steps / d.goal, 1) : 0}
              replayKey={replayKey}
              delay={i * 80}
              label={weekdayLetter(d.day)}
              rest={d.state === DayState.Rest}
              frozen={d.state === DayState.Frozen}
              today={d.isToday}
              selected={d.day === selectedDay}
            />
          </Pressable>
        ))}
      </View>
      <Text style={s.caption}>{factForDay(todayKey)}</Text>
      {/* Once the goal is reached today is a goal day, so there's no rest day to take or undo. */}
      {reached ? null : todayIsRest ? (
        <Pressable onPress={undoRestDay} hitSlop={8}>
          <Text style={s.restLink}>Undo today's rest day</Text>
        </Pressable>
      ) : restLeft > 0 ? (
        <Pressable onPress={takeRestDay} hitSlop={8}>
          <Text style={s.restLink}>Take today as a rest day · {restLeft} left this week</Text>
        </Pressable>
      ) : status === StepsStatus.Connected ? (
        <Text style={[s.restLink, s.restNote]}>This week's rest days are used · more on Monday</Text>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingHorizontal: 2,
  },
  caption: {
    fontFamily: font.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: space.sm,
    paddingHorizontal: space.md,
  },
  restLink: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.driftwood,
    textAlign: 'center',
    marginTop: space.sm,
  },
  restNote: { fontFamily: font.body, color: colors.ink3 },
});
