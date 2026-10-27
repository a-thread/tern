import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, space, typography } from '@shared/theme';
import { Group, Icon, IconBadge, Row } from '@shared/components/ui';
import { healthAppName } from '@shared/utils/healthApp';
import { useViewedDay } from '@shared/state/ViewedDayContext';
import { useSettings } from '@/domain/settings/SettingsContext';
import { useActivity } from '@/domain/activity/ActivityContext';
import { StepsStatus } from '@/domain/activity/models/stepsStatus';
import { useRootNavigation } from '@/navigation/useAppNavigation';
import { startItems, StartItem } from '../../models/gettingStarted';

/**
 * The one-off setup still to do, at the top of Today for someone new: steps and reminders (meals
 * and weigh-ins are in "Left to do" just below). Each row ticks off from what has really
 * happened, and opens the place to do it. Hidden with its ×, or once everything is done. It pays
 * no waypoints: those stay for the things themselves.
 */
export function GettingStarted() {
  const navigation = useRootNavigation();
  const { settings, updateSettings } = useSettings();
  const { onboarding } = settings;
  const { isToday } = useViewedDay();
  const { status, stepsReadable } = useActivity();

  if (!onboarding.wizardDone || onboarding.checklistHidden || !isToday)
    return null;
  const rows = startItems({
    healthAvailable: status !== StepsStatus.Unavailable,
    healthConnected: stepsReadable,
    stepGoalSet: settings.stepGoalHistory.length > 0,
    remindersOn: onboarding.notificationsAsked,
  });
  const done = rows.filter((r) => r.done).length;
  if (done === rows.length) return null;

  const hide = () =>
    updateSettings({ onboarding: { ...onboarding, checklistHidden: true } });

  const open = (item: StartItem) => {
    switch (item) {
      case StartItem.ConnectHealth:
        return navigation.navigate('Settings', { screen: 'HealthData' });
      case StartItem.StepGoal:
        return navigation.navigate('Settings', { screen: 'StepGoal' });
      case StartItem.Reminders:
        // Opening reminders is choosing them: the phone may ask to send them from here on.
        updateSettings({
          onboarding: { ...onboarding, notificationsAsked: true },
        });
        return navigation.navigate('Settings', { screen: 'RemindersSettings' });
    }
  };

  const title: Record<StartItem, string> = {
    [StartItem.ConnectHealth]: `Connect ${healthAppName()}`,
    [StartItem.StepGoal]: 'Set your step goal',
    [StartItem.Reminders]: 'Turn on reminders',
  };

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Text style={s.heading} accessibilityRole='header'>
          Getting started{' '}
          <Text style={s.count}>{`· ${done} of ${rows.length} done`}</Text>
        </Text>
        <Pressable
          onPress={hide}
          hitSlop={10}
          accessibilityRole='button'
          accessibilityLabel='Hide getting started'
        >
          <Icon name='close' size={18} color={colors.ink3} />
        </Pressable>
      </View>
      <Group>
        {rows.map(({ item, done: isDone }) => (
          <Row
            key={item}
            title={title[item]}
            icon={
              isDone ? (
                <IconBadge bg={colors.kelpTint}>
                  <Icon name='check' size={16} color={colors.kelp} />
                </IconBadge>
              ) : (
                <View style={s.todo} />
              )
            }
            chevron={!isDone}
            onPress={isDone ? undefined : () => open(item)}
          />
        ))}
      </Group>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: space.lg },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
    marginHorizontal: space.xs + 2,
  },
  heading: typography.heading,
  count: { fontFamily: font.body, fontSize: 12.5, color: colors.ink2 },
  todo: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.dove,
  },
});
