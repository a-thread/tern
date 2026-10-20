import React from 'react';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import { FoodSummary } from '@shared/components/FoodSummary/FoodSummary';
import { LeftToDoList } from './LeftToDoList';
import { DoneList } from './DoneList/DoneList';
import { TargetSuggestionCard } from './TargetSuggestionCard';

/**
 * The usual lists for the viewed day: what is left, what is done, the food, and (today, when
 * not resting) a suggested target. `resting` is a rest day whose lists were revealed anyway.
 */
export function DayLists({ resting }: { resting: boolean }) {
  const { isToday } = useViewedDay();

  return (
    <>
      <LeftToDoList />
      <DoneList />
      {/* Empty while neither calories nor macros are tracked. */}
      <FoodSummary />
      {isToday && !resting ? <TargetSuggestionCard /> : null}
    </>
  );
}
