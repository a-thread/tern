import React from 'react';

import { colors } from '@shared/theme';
import { Group, GroupLabel, IconBadge, Row, Icon } from '@shared/components/ui';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useDayNotes } from '@/domain/day-notes/DayNotesContext';
import { useRootNavigation } from '@/navigation/useAppNavigation';

/**
 * The viewed day's note: how the body felt, what shaped the day. Today and yesterday open the
 * note to write or edit it; an earlier day shows its note read-only, or nothing. Nothing at
 * all while notes are switched off.
 */
export function DayNoteCard() {
  const navigation = useRootNavigation();
  const { isToday, editable } = useViewedDay();
  const { enabled, onDay } = useDayNotes();

  if (!enabled || (!editable && !onDay)) return null;
  return (
    <>
      <GroupLabel>Notes</GroupLabel>
      <Group>
        <Row
          title={onDay ? 'Note' : 'Add a note'}
          sub={
            onDay?.text ??
            `How ${isToday ? 'is your body today' : 'was your body yesterday'}?`
          }
          subLines={onDay ? 4 : undefined}
          onPress={editable ? () => navigation.navigate('DayNote') : undefined}
          icon={
            <IconBadge bg={colors.driftwoodTint}>
              <Icon
                name='note-text-outline'
                size={16}
                color={colors.driftwood}
              />
            </IconBadge>
          }
          chevron={editable}
        />
      </Group>
    </>
  );
}
