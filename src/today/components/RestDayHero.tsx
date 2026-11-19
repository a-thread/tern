import React from 'react';
import type { HostInstance } from 'react-native';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useActivity } from '@/domain/activity/ActivityContext';
import { RestScene } from './RestScene/RestScene';
import { easeLayout } from '../utils/easeLayout';
import type { RestDay } from '../hooks/useRestDay';
import {
  pastRestCopy,
  restDetail,
  restReminderNote,
} from '../models/restDetail';
import { useSettings } from '@/domain/settings/SettingsContext';
import { remindersOn } from '@/domain/settings/models/reminderPlan';
import { useRootNavigation } from '../../navigation/useAppNavigation';

export function RestDayHero({
  heroRef,
  rest,
}: {
  heroRef: React.RefObject<HostInstance | null>;
  rest: RestDay;
}) {
  const { isToday } = useViewedDay();
  const { todaySteps, streak, stepsReadable } = useActivity();
  const { settings } = useSettings();
  const navigation = useRootNavigation();
  // A day outside this week has no record here; it reads as taken, as before.
  const past = pastRestCopy(rest.record?.chosenRest ?? true);

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
          ? 'Your streak is safe. Nothing you need to do today.'
          : past.line
      }
      detail={restDetail(
        stepsReadable ? (rest.record?.steps ?? todaySteps) : null,
        isToday ? streak : 0,
      )}
      note={
        isToday
          ? restReminderNote(
              remindersOn(settings.reminders, {
                ...settings,
                readSteps: stepsReadable,
              }),
            )
          : past.note
      }
      noteLink={
        !isToday && past.linksToSettings
          ? {
              label: 'Rest day settings',
              onPress: () =>
                navigation.navigate('Settings', { screen: 'RestDays' }),
            }
          : undefined
      }
    />
  );
}
