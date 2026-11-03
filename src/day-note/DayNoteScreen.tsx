import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, font, space, typography } from '@shared/theme';
import { Group, SheetNav } from '@shared/components/ui';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { confirm } from '@shared/utils/confirm';
import { dayWord } from '@shared/utils/date';
import type { RootStackParamList } from '@/navigation/types';
import { useDayNotes } from '@/domain/day-notes/DayNotesContext';
import { cleanDayNote } from '@/domain/day-notes/models/dayNote';
import { DayNoteField } from './components/DayNoteField/DayNoteField';

type Props = NativeStackScreenProps<RootStackParamList, 'DayNote'>;

/**
 * A note on the viewed day: how the body felt, what got in the way, anything worth
 * remembering when looking back at that day's steps and food.
 */
export default function DayNoteScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { day, today } = useViewedDay();
  const { onDay, save, clearDay } = useDayNotes();
  const [text, setText] = useState(onDay?.text ?? '');
  const dayLabel = dayWord(day, today);
  const blank = cleanDayNote(text) === undefined;

  const onSave = () => {
    save(text);
    navigation.goBack();
  };

  const remove = () =>
    confirm({
      title: 'Remove this note?',
      message: `${dayLabel}’s note will be deleted.`,
      action: 'Remove',
      onConfirm: () => {
        clearDay();
        navigation.goBack();
      },
    });

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <SheetNav
        title='Note'
        leftLabel='Cancel'
        onLeftPress={() => navigation.goBack()}
        rightLabel='Save'
        onRightPress={onSave}
        // A blank note with nothing saved has nothing to save; with one saved, Save clears it.
        rightDisabled={blank && !onDay}
      />

      <ScrollView
        keyboardShouldPersistTaps='handled'
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        <View style={s.head}>
          <Text style={s.title}>
            {day === today ? 'How is your body today?' : 'How was your body?'}
          </Text>
          <Text style={s.sub}>{dayLabel}</Text>
        </View>

        <DayNoteField value={text} onChange={setText} />

        <Text style={s.hint}>
          Only you see this. Looking back, it helps explain a day’s steps and
          food.
        </Text>

        {onDay ? (
          <Group style={{ marginTop: space.lg }}>
            <Pressable
              style={s.row}
              onPress={remove}
              accessibilityRole='button'
            >
              <Text
                style={s.danger}
              >{`Remove ${dayLabel.toLowerCase()}’s note`}</Text>
            </Pressable>
          </Group>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  head: { paddingVertical: space.md },
  title: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  sub: { ...typography.meta, marginTop: 4 },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
    marginTop: space.lg,
  },
  row: { paddingHorizontal: 13, paddingVertical: 12 },
  danger: { ...typography.rowTitle, color: colors.danger },
});
