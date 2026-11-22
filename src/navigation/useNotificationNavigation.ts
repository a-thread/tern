import { useEffect } from 'react';
import {
  StackActions,
  type NavigationContainerRefWithCurrent,
} from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { useViewedDay } from '@shared/state/ViewedDayContext';
import {
  NotificationTarget,
  tappedTarget,
  targetMeal,
} from '../domain/settings/models/notificationTarget';
import type { RootStackParamList } from './types';

type Nav = NavigationContainerRefWithCurrent<RootStackParamList>;

/** Opens over any open screen rather than losing its work; otherwise via Today. */
function open(nav: Nav, target: NotificationTarget) {
  const root = nav.getRootState();
  const onTabs = !root || root.routes[root.index]?.name === 'Tabs';
  if (onTabs) nav.navigate('Tabs', { screen: 'Today' });
  // Pushed, not navigated to: an open Log food for breakfast stays breakfast underneath.
  const push = (name: keyof RootStackParamList, params?: object) =>
    nav.dispatch(StackActions.push(name, params));
  switch (target) {
    case NotificationTarget.LogLunch:
    case NotificationTarget.LogDinner:
      push('LogFood', { meal: targetMeal(target) });
      return;
    case NotificationTarget.LogWeight:
      push('LogWeight');
      return;
    case NotificationTarget.CheckIn:
      push('CheckIn');
      return;
    case NotificationTarget.Streak:
      push('Streak');
      return;
    case NotificationTarget.Today:
      return;
  }
}

/** Clears the tap only once handled, so a remount neither repeats nor drops it. */
export function useNotificationNavigation(nav: Nav, ready: boolean) {
  const response = Notifications.useLastNotificationResponse();
  const { showToday } = useViewedDay();

  useEffect(() => {
    if (!ready || !response || !nav.isReady()) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER)
      return;
    Notifications.clearLastNotificationResponse();
    const { identifier, content } = response.notification.request;
    const target = tappedTarget(content?.data, identifier);
    if (!target) return;
    // Reminders are about today, whatever day was being looked at.
    showToday();
    open(nav, target);
  }, [ready, response, nav, showToday]);
}
