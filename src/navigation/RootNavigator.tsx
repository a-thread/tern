import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RestDayScreen from '../today/rest-day/RestDayScreen';
import LogFoodStack from '../food/log-food/LogFoodStack';
import EditFoodEntryScreen from '../food/edit-food/EditFoodEntryScreen';
import SaveMealScreen from '../food/save-meal/SaveMealScreen';
import LogWeightScreen from '../log-weight/LogWeightScreen';
import CheckInScreen from '../check-in/CheckInScreen';
import MealCheckInScreen from '../check-in/meal-check-in/MealCheckInScreen';
import MovementStack from '../movement/MovementStack';

import WaypointsScreen from '../journey/waypoints/WaypointsScreen';
import MilestoneScreen from '../journey/milestone/MilestoneScreen';
import SettingsStack from '../settings/SettingsStack';
import WelcomeStack from '../welcome/WelcomeStack';
import { useSettings } from '../domain/settings/SettingsContext';
import type { RootStackParamList } from './types';
import Tabs from './tabs/Tabs';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { settings } = useSettings();
  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false, freezeOnBlur: true }}
    >
      {/* A new install's setup wizard comes first; finishing or skipping it removes the
          route, and the app lands on Today. */}
      {settings.onboarding.wizardDone ? null : (
        <RootStack.Screen
          name='Welcome'
          component={WelcomeStack}
          options={{ gestureEnabled: false }}
        />
      )}

      {/* Primary Pages grouped by Tab */}
      <RootStack.Screen
        name='Tabs'
        component={Tabs}
        options={{ freezeOnBlur: false }}
      />

      {/* Sub Pages displayed as modals for fluid transitions */}
      <RootStack.Group screenOptions={{ presentation: 'modal' }}>
        <RootStack.Screen name='LogFood' component={LogFoodStack} />
        <RootStack.Screen name='LogWeight' component={LogWeightScreen} />
        <RootStack.Screen name='CheckIn' component={CheckInScreen} />
        <RootStack.Screen name='MealCheckIn' component={MealCheckInScreen} />
        <RootStack.Screen name='LogMovement' component={MovementStack} />
        <RootStack.Screen name='EditFood' component={EditFoodEntryScreen} />
        <RootStack.Screen name='SaveMeal' component={SaveMealScreen} />
        <RootStack.Screen name='Settings' component={SettingsStack} />
      </RootStack.Group>

      {/* Actual modals */}
      <RootStack.Group
        screenOptions={{
          presentation: 'transparentModal',
          animation: 'fade',
          freezeOnBlur: false,
        }}
      >
        <RootStack.Screen name='Waypoints' component={WaypointsScreen} />
        <RootStack.Screen name='Milestone' component={MilestoneScreen} />
        <RootStack.Screen name='RestDay' component={RestDayScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}
