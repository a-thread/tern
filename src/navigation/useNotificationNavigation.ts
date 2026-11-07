import { useEffect } from 'react';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import {
  notificationTarget,
  NotificationTarget,
  targetMeal,
} from '../domain/settings/models/notificationTarget';
import type { RootStackParamList } from './types';

type Nav = NavigationContainerRefWithCurrent<RootStackParamList>;

/** Opens the screen a notification target asks for, on top of Today. */
function open(nav: Nav, target: NotificationTarget) {
  // Start from Today, so closing the logging screen lands somewhere sensible.
  nav.navigate('Tabs', { screen: 'Today' });
  switch (target) {
    case NotificationTarget.LogLunch:
    case NotificationTarget.LogDinner:
      nav.navigate('LogFood', { meal: targetMeal(target) });
      return;
    case NotificationTarget.LogWeight:
      nav.navigate('LogWeight');
      return;
    case NotificationTarget.CheckIn:
      nav.navigate('CheckIn');
      return;
    case NotificationTarget.Streak:
      nav.navigate('Streak');
      return;
    case NotificationTarget.Today:
      return;
  }
}

/**
 * Tapping a notification opens what it asked for: the lunch reminder opens logging lunch, the
 * weigh-in reminder opens Log weight, and so on. Works whether the tap launched the app or
 * brought it back. Waits for `ready` (navigation mounted, setup wizard done), and clears the
 * tap once handled so a remount (sign-in, a change of account) doesn't open it again.
 */
export function useNotificationNavigation(nav: Nav, ready: boolean) {
  const response = Notifications.useLastNotificationResponse();
  const { showToday } = useViewedDay();

  useEffect(() => {
    if (!ready || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER)
      return;
    Notifications.clearLastNotificationResponse();
    const target = notificationTarget(response.notification.request.identifier);
    if (!target || !nav.isReady()) return;
    // Reminders are about today, whatever day was being looked at.
    showToday();
    open(nav, target);
  }, [ready, response, nav, showToday]);
}
