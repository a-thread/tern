import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsRootScreen from '@app/screens/SettingsScreen';
import StepGoalScreen from '@today/screens/StepGoalScreen';
import FoodDisplayScreen from '@food/screens/FoodDisplayScreen';
import HealthDataScreen from '@today/screens/HealthDataScreen';
import TargetsScreen from '@food/screens/TargetsScreen';
import RestDaysScreen from '@today/screens/RestDaysScreen';
import MedicationScreen from '@medication/screens/MedicationScreen';
import type { SettingsStackParamList } from '@shared/navigation/types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

/** Presented modally from the root stack; screens inside push/pop normally. */
export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      <Stack.Screen name='SettingsRoot' component={SettingsRootScreen} />
      <Stack.Screen name='StepGoal' component={StepGoalScreen} />
      <Stack.Screen name='FoodDisplay' component={FoodDisplayScreen} />
      <Stack.Screen name='HealthData' component={HealthDataScreen} />
      <Stack.Screen name='Targets' component={TargetsScreen} />
      <Stack.Screen name='RestDays' component={RestDaysScreen} />
      <Stack.Screen name='Medication' component={MedicationScreen} />
    </Stack.Navigator>
  );
}
