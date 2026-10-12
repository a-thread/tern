import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsRootScreen from '@/settings/SettingsScreen';
import StepGoalScreen from '@/settings/step-goal/StepGoalScreen';
import FoodDisplayScreen from '@/settings/food-display/FoodDisplayScreen';
import HealthDataScreen from '@/settings/health-data/HealthDataScreen';
import TargetsScreen from '@/settings/targets/TargetsScreen';
import RestDaysScreen from '@/settings/rest-days/RestDaysScreen';
import MedicationScreen from '@/settings/medication/MedicationScreen';
import ActivitySettingsScreen from '@/settings/activity/ActivitySettingsScreen';
import FoodSettingsScreen from '@/settings/food/FoodSettingsScreen';
import WeightSettingsScreen from '@/settings/weight/WeightSettingsScreen';
import WaterSettingsScreen from '@/settings/water/WaterSettingsScreen';
import MoodSettingsScreen from '@/settings/mood/MoodSettingsScreen';
import RemindersSettingsScreen from '@/settings/reminders/RemindersSettingsScreen';
import DataSettingsScreen from '@/settings/data/DataSettingsScreen';
import type { SettingsStackParamList } from '@/shared/navigation/types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

/** Presented modally from the root stack; screens inside push/pop normally. */
export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      <Stack.Screen name='SettingsRoot' component={SettingsRootScreen} />
      <Stack.Screen name='ActivitySettings' component={ActivitySettingsScreen} />
      <Stack.Screen name='FoodSettings' component={FoodSettingsScreen} />
      <Stack.Screen name='WeightSettings' component={WeightSettingsScreen} />
      <Stack.Screen name='WaterSettings' component={WaterSettingsScreen} />
      <Stack.Screen name='MoodSettings' component={MoodSettingsScreen} />
      <Stack.Screen name='RemindersSettings' component={RemindersSettingsScreen} />
      <Stack.Screen name='DataSettings' component={DataSettingsScreen} />
      <Stack.Screen name='StepGoal' component={StepGoalScreen} />
      <Stack.Screen name='FoodDisplay' component={FoodDisplayScreen} />
      <Stack.Screen name='HealthData' component={HealthDataScreen} />
      <Stack.Screen name='Targets' component={TargetsScreen} />
      <Stack.Screen name='RestDays' component={RestDaysScreen} />
      <Stack.Screen name='Medication' component={MedicationScreen} />
    </Stack.Navigator>
  );
}
