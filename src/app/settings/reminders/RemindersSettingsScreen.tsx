import React from 'react';

import { Group, GroupLabel, Row } from '@/shared/components/ui/Layout';
import type { SettingsStackParamList } from '@/navigation/types';
import { useSettings } from '@/domain/settings/SettingsContext';
import { SettingsPage } from '@/settings/components/SettingsPage/SettingsPage';
import { StreakReminderRows } from '@/settings/components/StreakReminderRows/StreakReminderRows';
import { MealReminderRows } from '@/settings/components/MealReminderRows/MealReminderRows';
import { WeightReminderRows } from '@/settings/components/WeightReminderRows/WeightReminderRows';
import { WaterReminderRows } from '@/settings/components/WaterReminderRows/WaterReminderRows';
import { MoodReminderRows } from '@/settings/components/MoodReminderRows/MoodReminderRows';
import { useSettingsNavigation } from '@/navigation/useAppNavigation';

type Section = keyof Pick<SettingsStackParamList, 'WeightSettings' | 'WaterSettings' | 'MoodSettings'>;

/**
 * Settings › Reminders: every reminder in one place. The rows are the same ones on each
 * feature's page, so a change here shows there too. A reminder for something that isn't
 * tracked says so, and leads to where it's turned on.
 */
export default function RemindersSettingsScreen() {
  const navigation = useSettingsNavigation();
  const { settings } = useSettings();

  const off = (what: string, section: Section) => (
    <Row
      title={`${what} isn't tracked`}
      sub='Turn it on to set this reminder'
      chevron
      onPress={() => navigation.navigate(section)}
    />
  );

  return (
    <SettingsPage title='Reminders'>
      <GroupLabel>Streak</GroupLabel>
      <Group>
        <StreakReminderRows />
      </Group>

      <GroupLabel>Meals</GroupLabel>
      <Group>
        <MealReminderRows />
      </Group>

      <GroupLabel>Weigh-in</GroupLabel>
      <Group>{settings.trackWeight ? <WeightReminderRows /> : off('Weight', 'WeightSettings')}</Group>

      <GroupLabel>Water</GroupLabel>
      <Group>{settings.trackWater ? <WaterReminderRows /> : off('Water', 'WaterSettings')}</Group>

      <GroupLabel>Check-in</GroupLabel>
      <Group>{settings.trackMood ? <MoodReminderRows /> : off('Mood and stress', 'MoodSettings')}</Group>
    </SettingsPage>
  );
}
