import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, space } from '@shared/theme';
import { DayRing } from './components/DayRing';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { easeLayout } from '../../utils/easeLayout';
import { weekdayLetter } from '@shared/utils/date';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useActivity } from '@/domain/activity/ActivityContext';
import { factForDay } from './utils/ternFacts';
import { dayRingLabel } from './utils/dayRingLabel';
import { DayState } from '@shared/models/dayState';
import { reachedGoalToday, showsRestLink } from '../../models/restLink';

/**
 * This week's seven rings, a fact for the day, and the rest-day link. Tapping a
 * day that has happened views it (see `useViewedDay`): Home and Food show that day,
 * and a link here leads back to today.
 */
export function WeekStrip({
  replayKey,
  stripRef,
  restRef,
}: {
  replayKey: number;
  /** The rings and the rest-day link, for the tips on Today to point at. */
  stripRef?: React.RefObject<View | null>;
  restRef?: React.RefObject<View | null>;
}) {
  const {
    day: selectedDay,
    today: todayKey,
    isToday,
    setDay: onSelect,
    showToday,
  } = useViewedDay();
  const { settings } = useSettings();
  const {
    week,
    todaySteps,
    stepsReadable,
    restLeft,
    todayIsRest,
    takeRestDay,
    undoRestDay,
  } = useActivity();
  const today = {
    todaySteps,
    stepGoal: settings.stepGoal,
    todayState: week.find((d) => d.isToday)?.state,
  };
  const reached = reachedGoalToday(today);
  const restLink = showsRestLink({ ...today, todayIsRest, restLeft });
  const movementGoal = settings.trackMovement
    ? settings.movementGoalMinutes
    : 0;

  return (
    <>
      <View ref={stripRef} collapsable={false} style={s.weekRow}>
        {week.map((d, i) => (
          <Pressable
            key={d.day}
            onPress={() => onSelect(d.day)}
            disabled={d.future}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole='button'
            accessibilityState={{
              selected: d.day === selectedDay,
              disabled: d.future,
            }}
            accessibilityLabel={dayRingLabel(d, movementGoal)}
          >
            <DayRing
              // Whichever got closer to a goal day: steps, or minutes of movement.
              progress={Math.min(
                Math.max(
                  d.goal > 0 ? d.steps / d.goal : 0,
                  movementGoal > 0 ? d.minutes / movementGoal : 0,
                ),
                1,
              )}
              moved={d.movedToGoal}
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
      {!isToday ? (
        <Pressable onPress={showToday} hitSlop={8} accessibilityRole='button'>
          <Text style={[s.restLink, s.backLink]}>Back to today</Text>
        </Pressable>
      ) : restLink && todayIsRest ? (
        // Wrapped in a view Android won't flatten away, so the tip on Today can measure it;
        // it hugs the text, so the tip's outline does too.
        <View ref={restRef} collapsable={false} style={s.restAnchor}>
          <Pressable
            onPress={() => {
              easeLayout(); // the page glides to its new shape
              undoRestDay();
            }}
            hitSlop={8}
            accessibilityRole='button'
          >
            <Text style={[s.restLink, s.anchored]}>Undo today's rest day</Text>
          </Pressable>
        </View>
      ) : restLink ? (
        <View ref={restRef} collapsable={false} style={s.restAnchor}>
          <Pressable
            onPress={() => {
              easeLayout(); // the page glides to its new shape
              takeRestDay();
            }}
            hitSlop={8}
            accessibilityRole='button'
          >
            <Text style={[s.restLink, s.anchored]}>
              Take today as a rest day · {restLeft} left this week
            </Text>
          </Pressable>
        </View>
      ) : !reached && stepsReadable && settings.restDaysPerWeek > 0 ? (
        // Only once a week's allowance is spent: with none allowed there's nothing "used".
        <Text style={[s.restLink, s.restNote]}>
          This week's rest days are used · more on Monday
        </Text>
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
  // The anchor carries the link's top margin, so the outline sits snug on the text.
  restAnchor: { alignSelf: 'center', marginTop: space.sm },
  anchored: { marginTop: 0 },
  backLink: { color: colors.coral },
});
