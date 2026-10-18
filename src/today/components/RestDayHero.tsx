import React from 'react';
import type { View } from 'react-native';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useActivity } from '@/domain/activity/ActivityContext';
import { RestScene } from './RestScene/RestScene';
import { easeLayout } from '../utils/easeLayout';
import type { RestDay } from '../hooks/useRestDay';
import { restDetail } from '../models/restDetail';

/**
 * The rest scene in place of the sky card, with its copy for the viewed day. Today it promises
 * the streak is safe and the reminders quiet; a past rest day just says the streak carried on.
 */
export function RestDayHero({
  heroRef,
  rest,
}: {
  heroRef: React.RefObject<View | null>;
  rest: RestDay;
}) {
  const { isToday } = useViewedDay();
  const { todaySteps, streak } = useActivity();

  return (
    <RestScene
      heroRef={heroRef}
      entrance={rest.entrance}
      leaving={rest.leaving}
      onLeft={() => {
        easeLayout(); // the taller scene card gives way to the sky card
        rest.finishLeaving();
      }}
      onTouchdown={rest.markTouchedDown}
      title='Rest day'
      line={
        isToday
          ? 'Your streak is safe. Nothing to log today.'
          : 'A day off. Your streak carried on.'
      }
      detail={restDetail(
        rest.record?.steps ?? todaySteps,
        isToday ? streak : 0,
      )}
      note={isToday ? 'Reminders are quiet until tomorrow' : undefined}
    />
  );
}
