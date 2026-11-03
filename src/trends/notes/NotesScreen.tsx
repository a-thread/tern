import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, space, typography } from '@shared/theme';
import { FootNote, Group, PushHeader, Row } from '@shared/components/ui';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { formatLongDate } from '@shared/utils/date';
import { useRootNavigation } from '@/navigation/useAppNavigation';
import type { TrendsStackParamList } from '../navigation';
import { useDayNotes } from '@/domain/day-notes/DayNotesContext';

type Props = NativeStackScreenProps<TrendsStackParamList, 'Notes'>;

/** Every note of the last six months, newest first. Tapping one shows that day on Today. */
export default function NotesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const root = useRootNavigation();
  const { setDay } = useViewedDay();
  const { notes } = useDayNotes();
  const newestFirst = [...notes].reverse();

  const openDay = (day: string) => {
    setDay(day);
    root.navigate('Tabs', { screen: 'Today' });
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}
    >
      <PushHeader
        title='Notes'
        backLabel='Trends'
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 40,
        }}
      >
        {newestFirst.length === 0 ? (
          <Text style={s.empty}>
            No notes yet. Write one from Today: how your body feels, what got in
            the way, anything worth remembering.
          </Text>
        ) : (
          <Group style={{ marginTop: space.md }}>
            {newestFirst.map((n) => (
              <Row
                key={n.day}
                title={formatLongDate(n.day)}
                sub={n.text}
                onPress={() => openDay(n.day)}
                chevron
              />
            ))}
          </Group>
        )}
        <FootNote>
          Tap a note to see that day’s steps and food beside it.
        </FootNote>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  empty: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 12,
    marginTop: space.lg,
  },
});
