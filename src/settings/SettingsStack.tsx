import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsRootScreen from './SettingsRootScreen';
import StepGoalScreen from './StepGoalScreen';
import FoodDisplayScreen from './FoodDisplayScreen';
import HealthDataScreen from './HealthDataScreen';
import TargetsScreen from './TargetsScreen';
import RestDaysScreen from './RestDaysScreen';
import type { SettingsStackParamList } from './types';

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
    </Stack.Navigator>
  );
}
