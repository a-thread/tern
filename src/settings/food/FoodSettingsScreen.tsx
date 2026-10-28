import React from 'react';

import { FootNote, Group, GroupLabel, ToggleRow } from '@shared/components/ui';
import { useSettings } from '../../domain/settings/SettingsContext';
import { SettingsPage } from '../components/SettingsPage';
import { CalorieTargetsRow } from './components/CalorieTargetsRow';
import { FoodDisplayRow } from './components/FoodDisplayRow';
import { MealCheckInToggleRow } from './components/MealCheckInToggleRow';
import { MealReminderRows } from '../components/MealReminderRows';
import { useSettingsNavigation } from '../../navigation/useAppNavigation';

/**
 * Settings › Food: whether food is logged at all, then targets, how food is shown, the
 * "How was it?" after meals, and the meal reminders.
 */
export default function FoodSettingsScreen() {
  const navigation = useSettingsNavigation();
  const { settings, updateSettings } = useSettings();
  return (
    <SettingsPage title='Food'>
      <Group>
        <ToggleRow
          title='Track food'
          sub='The Food tab, meals on Today and meal reminders'
          on={settings.trackFood}
          onToggle={(v) => updateSettings({ trackFood: v })}
        />
      </Group>
      {settings.trackFood ? null : (
        <FootNote>
          Meals you've logged are kept, and come back if you turn this on again.
        </FootNote>
      )}

      {settings.trackFood ? (
        <>
          <Group>
            <CalorieTargetsRow onPress={() => navigation.navigate('Targets')} />
            <FoodDisplayRow
              onPress={() => navigation.navigate('FoodDisplay')}
            />
          </Group>

          <GroupLabel>After meals</GroupLabel>
          <Group>
            <MealCheckInToggleRow />
          </Group>
          <FootNote>
            Each meal on the Food page gets a "How was it?" once it has food in
            it. It is only for you to look back on, and never affects waypoints.
          </FootNote>

          <GroupLabel>Reminders</GroupLabel>
          <Group>
            <MealReminderRows />
          </Group>
        </>
      ) : null}
    </SettingsPage>
  );
}
