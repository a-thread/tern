import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsRootScreen from '@app/screens/SettingsScreen';
import StepGoalScreen from '@today/screens/StepGoalScreen';
import FoodDisplayScreen from '@food/screens/FoodDisplayScreen';
import HealthDataScreen from '@today/screens/HealthDataScreen';
import TargetsScreen from '@food/screens/TargetsScreen';
import RestDaysScreen from '@today/screens/RestDaysScreen';
import MedicationScreen from '@medication/screens/MedicationScreen';
import ActivitySettingsScreen from '@today/screens/ActivitySettingsScreen';
import FoodSettingsScreen from '@food/screens/FoodSettingsScreen';
import WeightSettingsScreen from '@weight/screens/WeightSettingsScreen';
import WaterSettingsScreen from '@water/screens/WaterSettingsScreen';
import MoodSettingsScreen from '@mood/screens/MoodSettingsScreen';
import RemindersSettingsScreen from '@app/screens/RemindersSettingsScreen';
import DataSettingsScreen from '@app/screens/DataSettingsScreen';
import type { SettingsStackParamList } from '@shared/navigation/types';

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
