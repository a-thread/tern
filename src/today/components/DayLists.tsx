import React from 'react';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import { IntakeBars } from '@shared/components/IntakeBars/IntakeBars';
import { LeftToDoList } from './LeftToDoList';
import { DoneList } from './DoneList/DoneList';
import { DayNoteCard } from './DayNoteCard/DayNoteCard';
import { TargetSuggestionCard } from './TargetSuggestionCard';
import { GettingStarted } from './GettingStarted/GettingStarted';

/** `resting` is a rest day whose lists were revealed anyway. */
export function DayLists({ resting }: { resting: boolean }) {
  const { isToday } = useViewedDay();

  return (
    <>
      <GettingStarted />
      <LeftToDoList />
      <DoneList />
      <DayNoteCard />
      {/* Empty while neither calories nor macros are tracked. */}
      <IntakeBars />
      {isToday && !resting ? <TargetSuggestionCard /> : null}
    </>
  );
}
