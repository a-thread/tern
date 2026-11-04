import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { space, typography } from '@shared/theme';
import { useDayKey } from '@shared/hooks/useDayKey';
import { addDays, formatShortDate } from '@shared/utils/date';
import { TrendCard, TrendFigure } from './TrendCard';
import { TrendRanges, type TrendRange } from '../models/trendRange';
import { useTrendsNavigation } from '@/navigation/useAppNavigation';
import { notesBetween } from '@/domain/day-notes/models/dayNote';
import { useDayNotes } from '@/domain/day-notes/DayNotesContext';

/** How many days in the range have a note, and the latest one. Tapping opens every note. */
export default function NotesTrendCard({ range }: { range: TrendRange }) {
  const navigation = useTrendsNavigation();
  const { notes } = useDayNotes();
  const today = useDayKey();
  const inRange = notesBetween(
    notes,
    addDays(today, -(TrendRanges.DAYS[range] - 1)),
    today,
  );
  const latest = inRange[0];

  return (
    <TrendCard title='Notes' onPress={() => navigation.navigate('Notes')}>
      {latest ? (
        <>
          <TrendFigure
            value={`${inRange.length} ${inRange.length === 1 ? 'day' : 'days'}`}
            sub={`with a note ${TrendRanges.LABEL[range]}`}
          />
          <Text style={s.latest} numberOfLines={2}>
            {`${formatShortDate(latest.day)} · ${latest.text}`}
          </Text>
        </>
      ) : (
        <Text style={s.sub}>
          No notes in this range yet. Add one from Today.
        </Text>
      )}
    </TrendCard>
  );
}

const s = StyleSheet.create({
  sub: { ...typography.small, marginTop: space.xs },
  latest: { ...typography.caption, marginTop: space.sm },
});
