import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsRootScreen from './SettingsScreen';
import StepGoalScreen from './step-goal/StepGoalScreen';
import FoodDisplayScreen from './food-display/FoodDisplayScreen';
import HealthDataScreen from './health-data/HealthDataScreen';
import TargetsScreen from './targets/TargetsScreen';
import RestDaysScreen from './rest-days/RestDaysScreen';
import MedicationScreen from './medication/MedicationScreen';
import ActivitySettingsScreen from './activity/ActivitySettingsScreen';
import FoodSettingsScreen from './food/FoodSettingsScreen';
import WeightSettingsScreen from './weight/WeightSettingsScreen';
import WaterSettingsScreen from './water/WaterSettingsScreen';
import MoodSettingsScreen from './mood/MoodSettingsScreen';
import RemindersSettingsScreen from './reminders/RemindersSettingsScreen';
import DataSettingsScreen from './data/DataSettingsScreen';
import type { SettingsStackParamList } from '../navigation/types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

/** Presented modally from the root stack; screens inside push/pop normally. */
export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      <Stack.Screen name='SettingsRoot' component={SettingsRootScreen} />
      <Stack.Screen
        name='ActivitySettings'
        component={ActivitySettingsScreen}
      />
      <Stack.Screen name='FoodSettings' component={FoodSettingsScreen} />
      <Stack.Screen name='WeightSettings' component={WeightSettingsScreen} />
      <Stack.Screen name='WaterSettings' component={WaterSettingsScreen} />
      <Stack.Screen name='MoodSettings' component={MoodSettingsScreen} />
      <Stack.Screen
        name='RemindersSettings'
        component={RemindersSettingsScreen}
      />
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
