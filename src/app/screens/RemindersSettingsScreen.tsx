import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Group, GroupLabel, Row } from '@shared/components/ui';
import type { SettingsStackParamList } from '@shared/navigation/types';
import { useSettings } from '@settings/SettingsContext';
import { SettingsPage } from '@settings/components/SettingsPage';
import { StreakReminderRows } from '@today/components/StreakReminderRows';
import { MealReminderRows } from '@food/components/MealReminderRows';
import { WeightReminderRows } from '@weight/components/WeightReminderRows';
import { WaterReminderRows } from '@water/components/WaterReminderRows';
import { MoodReminderRows } from '@mood/components/MoodReminderRows';

type Section = keyof Pick<SettingsStackParamList, 'WeightSettings' | 'WaterSettings' | 'MoodSettings'>;

/**
 * Settings › Reminders: every reminder in one place. The rows are the same ones on each
 * feature's page, so a change here shows there too. A reminder for something that isn't
 * tracked says so, and leads to where it's turned on.
 */
export default function RemindersSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
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
