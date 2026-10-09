import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space } from '@shared/theme';
import { BottomSheet, Stepper } from '@shared/components/ui';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays } from '@shared/utils/date';
import { useMovement } from '@movement/MovementContext';
import {
  Activity,
  ACTIVITY_LABEL,
  clampMinutes,
  Effort,
  EFFORT_LABEL,
  entriesOn,
  isLoggableDay,
  MovementLimits,
  countsTowardGoal,
} from '@movement/models/movementEntry';

const ACTIVITIES = Object.values(Activity);
const EFFORTS = Object.values(Effort);

/**
 * Log movement for a day (today or yesterday): an activity, minutes and an
 * optional effort. Shows what's already logged that day; entries logged here
 * can be removed, workouts from Health Connect are shown as they are.
 */
export function MovementSheet({
  visible,
  onClose,
  day,
}: {
  visible: boolean;
  onClose: () => void;
  /** The day to log for; defaults to today. */
  day?: string;
}) {
  const today = useDayKey();
  const target = day ?? today;
  const { entries, add, remove } = useMovement();
  const [activity, setActivity] = useState<Activity>(Activity.Swim);
  const [minutes, setMinutes] = useState<number>(MovementLimits.QUICK_MINUTES);
  const [effort, setEffort] = useState<Effort | null>(null);

  // A fresh form each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setActivity(Activity.Swim);
      setMinutes(MovementLimits.QUICK_MINUTES);
      setEffort(null);
    }
  }, [visible]);

  const logged = entriesOn(entries, target);
  const canLog = isLoggableDay(target, today);
  const title = target === today ? 'Log movement' : target === addDays(today, -1) ? "Yesterday's movement" : 'Movement';

  const save = () => {
    if (add({ day: target, activity, minutes, effort })) onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.top}>
        <Text style={s.title}>{title}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel='Close'>
          <Text style={s.close}>×</Text>
        </Pressable>
      </View>

      {logged.length ? (
        <View style={s.logged}>
          {logged.map((e) => (
            <View key={e.id} style={s.loggedRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.loggedName}>{ACTIVITY_LABEL[e.activity]}</Text>
                <Text style={s.sub}>
                  {[`${e.minutes} min`, e.effort ? EFFORT_LABEL[e.effort].toLowerCase() : null, e.source === 'healthConnect' ? 'from Health Connect' : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              {e.source === 'manual' && canLog ? (
                <Pressable onPress={() => remove(e.id)} hitSlop={8} accessibilityRole='button' accessibilityLabel={`Remove ${ACTIVITY_LABEL[e.activity]}`}>
                  <Text style={s.remove}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {canLog ? (
        <>
          <Text style={s.label}>Activity</Text>
          <View style={s.chips}>
            {ACTIVITIES.map((a) => (
              <Chip key={a} label={ACTIVITY_LABEL[a]} on={activity === a} onPress={() => setActivity(a)} />
            ))}
          </View>
          {!countsTowardGoal(activity) ? (
            <Text style={s.sub}>Already in your steps, so it's logged but doesn't add to a goal day.</Text>
          ) : null}

          <View style={s.minutesRow}>
            <Text style={s.loggedName}>Minutes</Text>
            <Stepper
              value={minutes}
              valueMinWidth={44}
              decrementLabel='Fewer minutes'
              incrementLabel='More minutes'
              onDecrement={() => setMinutes((m) => clampMinutes(m - MovementLimits.STEP))}
              onIncrement={() => setMinutes((m) => clampMinutes(m + MovementLimits.STEP))}
            />
          </View>

          <Text style={s.label}>Effort (optional)</Text>
          <View style={s.chips}>
            {EFFORTS.map((e) => (
              <Chip
                key={e}
                label={EFFORT_LABEL[e]}
                on={effort === e}
                // Tapping the chosen effort again clears it.
                onPress={() => setEffort((cur) => (cur === e ? null : e))}
              />
            ))}
          </View>

          <Pressable style={s.save} onPress={save} accessibilityRole='button'>
            <Text style={s.saveText}>Save</Text>
          </Pressable>
        </>
      ) : (
        <Text style={s.sub}>Movement can be logged for today and yesterday.</Text>
      )}
    </BottomSheet>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, on && s.chipOn]}
      accessibilityRole='button'
      accessibilityState={{ selected: on }}
    >
      <Text style={[s.chipText, on && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  title: { fontFamily: font.semibold, fontSize: 15, color: colors.ink },
  close: { fontFamily: font.body, fontSize: 24, color: colors.ink3 },
  logged: { marginBottom: space.sm },
  loggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  loggedName: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  sub: { fontFamily: font.body, fontSize: 11.5, color: colors.ink2, marginTop: 2 },
  remove: { fontFamily: font.semibold, fontSize: 12, color: colors.coral },
  label: { fontFamily: font.body, fontSize: 12, color: colors.ink2, marginTop: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.doveTint },
  chipOn: { backgroundColor: colors.ink },
  chipText: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink2 },
  chipTextOn: { color: colors.paper },
  minutesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md },
  save: {
    backgroundColor: colors.coral,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: space.lg,
  },
  saveText: { fontFamily: font.bold, fontSize: 14, color: '#fff' },
});
