import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@shared/theme';
import { SegmentedControl, Stepper } from '@shared/components/ui';
import { SettingsSubRow } from '@/settings/components/SettingsSubRow/SettingsSubRow';
import {
  clockParts,
  Meridiem,
  stepHour,
  stepMinute,
  withMeridiem,
  withTypedHour,
  withTypedMinute,
} from './utils/timeOfDay';

const MERIDIEMS: readonly Meridiem[] = [Meridiem.Am, Meridiem.Pm];

/**
 * A labelled time of day with the hour, the minutes and am / pm set apart, so 8 am to
 * 8 pm is one tap rather than a long run of steps. Hours and minutes can also be typed.
 */
export default function TimeOfDayRow({
  label,
  minutes,
  onChange,
  minuteStep,
  nested = true,
}: {
  label: string;
  /** Minutes after midnight. */
  minutes: number;
  onChange: (minutes: number) => void;
  /** How far − / + moves the minutes. */
  minuteStep: number;
  /**
   * Indented under a reminder's on/off row (the default). False for a row of its own,
   * lined up with the rows around it.
   */
  nested?: boolean;
}) {
  const { hour, minute, meridiem } = clockParts(minutes);
  // What's being typed: saved once the field is left, so "12" isn't saved as 1 and then 12.
  // The ref holds it too, so leaving the field (blur and submit both fire) saves it once.
  const [hourText, setHourText] = useState<string | null>(null);
  const [minuteText, setMinuteText] = useState<string | null>(null);
  const draft = useRef<string | null>(null);

  const clear = () => {
    draft.current = null;
    setHourText(null);
    setMinuteText(null);
  };
  // A step or am / pm drops any half-typed value, so the field shows what was saved.
  const change = (next: number) => {
    clear();
    onChange(next);
  };
  const type = (set: (text: string) => void) => (text: string) => {
    draft.current = text;
    set(text);
  };
  const commit = (parse: (minutes: number, text: string) => number | null) => {
    const next = draft.current === null ? null : parse(minutes, draft.current);
    clear();
    if (next !== null && next !== minutes) onChange(next);
  };

  return (
    <SettingsSubRow label={label} nested={nested}>
      <View style={s.controls}>
        <Stepper
          compact
          value={hourText ?? String(hour)}
          onDecrement={() => change(stepHour(minutes, -1))}
          onIncrement={() => change(stepHour(minutes, 1))}
          decrementLabel={`${label} an hour earlier`}
          incrementLabel={`${label} an hour later`}
          valueLabel={`${label} hour`}
          keyboardType='number-pad'
          valueMinWidth={20}
          onChangeValue={type(setHourText)}
          onEndEditing={() => commit(withTypedHour)}
        />
        <Text style={s.colon}>:</Text>
        <Stepper
          compact
          value={minuteText ?? String(minute).padStart(2, '0')}
          onDecrement={() => change(stepMinute(minutes, -1, minuteStep))}
          onIncrement={() => change(stepMinute(minutes, 1, minuteStep))}
          decrementLabel={`${label} ${minuteStep} minutes earlier`}
          incrementLabel={`${label} ${minuteStep} minutes later`}
          valueLabel={`${label} minutes`}
          keyboardType='number-pad'
          valueMinWidth={22}
          onChangeValue={type(setMinuteText)}
          onEndEditing={() => commit(withTypedMinute)}
        />
        <SegmentedControl
          options={MERIDIEMS}
          value={meridiem}
          onChange={(m) => change(withMeridiem(minutes, m))}
          style={s.meridiem}
        />
      </View>
    </SettingsSubRow>
  );
}

const s = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  colon: { fontFamily: font.semibold, fontSize: 13, color: colors.ink2 },
  meridiem: { width: 84, marginLeft: 4 },
});
