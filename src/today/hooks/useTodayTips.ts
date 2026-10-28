import { useRef } from 'react';
import type { View } from 'react-native';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useTips } from '@shared/hooks/useTips';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useActivity } from '@/domain/activity/ActivityContext';
import { Tip, Tips } from '@/domain/settings/models/onboarding';
import { showsRestLink } from '../models/restLink';
import { todayTipText } from '../models/todayTips';

/** Lets the week strip's rings fill before a tip points at them. */
const SETTLE_MS = 900;

/**
 * The one-time tips on Today: the week strip, the rest-day link, then the waypoints chip. They
 * wait while `hold` is true (a celebration, the water sheet) and while a past day is in view.
 * The rest-day tip only applies while there's a rest-day link (not once the goal is reached, or
 * with none left); otherwise it's skipped and left out of the count.
 */
export function useTodayTips({
  rootRef,
  chipRef,
  hold,
}: {
  rootRef: React.RefObject<View | null>;
  chipRef: React.RefObject<View | null>;
  hold: boolean;
}) {
  const stripRef = useRef<View>(null);
  const restRef = useRef<View>(null);
  const { settings } = useSettings();
  const { isToday } = useViewedDay();
  const activity = useActivity();
  const restLink = showsRestLink({
    todaySteps: activity.todaySteps,
    stepGoal: settings.stepGoal,
    todayState: activity.week.find((d) => d.isToday)?.state,
    todayIsRest: activity.todayIsRest,
    restLeft: activity.restLeft,
  });

  const tips = useTips({
    group: Tips.TODAY,
    relevant: Tips.TODAY.filter((t) => t !== Tip.RestDay || restLink),
    anchors: {
      [Tip.WeekStrip]: stripRef,
      [Tip.RestDay]: restRef,
      [Tip.Waypoints]: chipRef,
    },
    rootRef,
    ready: isToday && !hold,
    settleMs: SETTLE_MS,
  });

  return {
    stripRef,
    restRef,
    ...tips,
    text: tips.shown
      ? todayTipText(tips.shown.tip, settings.restDaysPerWeek)
      : null,
  };
}
