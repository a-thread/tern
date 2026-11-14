import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@shared/theme';

import RestDayScreen from '../today/rest-day/RestDayScreen';
import LogFoodStack from '../food/log-food/LogFoodStack';
import EditFoodEntryScreen from '../food/edit-food/EditFoodEntryScreen';
import SaveMealScreen from '../food/save-meal/SaveMealScreen';
import LogWeightScreen from '../log-weight/LogWeightScreen';
import CheckInScreen from '../check-in/CheckInScreen';
import DayNoteScreen from '../day-note/DayNoteScreen';
import MealCheckInScreen from '../check-in/meal-check-in/MealCheckInScreen';
import MovementStack from '../movement/MovementStack';

import WaypointsScreen from '../journey/waypoints/WaypointsScreen';
import MilestoneScreen from '../journey/milestone/MilestoneScreen';
import DestinationScreen from '../journey/destination/DestinationScreen';
import WaypointsInfoScreen from '../journey/waypoints-info/WaypointsInfoScreen';
import RouteInfoScreen from '../journey/route-info/RouteInfoScreen';
import StreakScreen from '../today/streak/StreakScreen';
import SettingsStack from '../settings/SettingsStack';
import WelcomeStack from '../welcome/WelcomeStack';
import { useSettings } from '../domain/settings/SettingsContext';
import type { RootStackParamList } from './types';
import Tabs from './tabs/Tabs';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { settings } = useSettings();
  // The app draws edge to edge, so on Android a sub page would run under the system
  // navigation bar. Its container stops above it instead (the tab bar does the same for itself).
  const insets = useSafeAreaInsets();
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
      <RootStack.Group
        screenOptions={{
          presentation: 'modal',
          contentStyle: {
            backgroundColor: colors.paper,
            paddingBottom: insets.bottom,
          },
        }}
      >
        <RootStack.Screen name='LogFood' component={LogFoodStack} />
        <RootStack.Screen name='LogWeight' component={LogWeightScreen} />
        <RootStack.Screen name='CheckIn' component={CheckInScreen} />
        <RootStack.Screen name='DayNote' component={DayNoteScreen} />
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
        <RootStack.Screen name='Destination' component={DestinationScreen} />
        <RootStack.Screen
          name='WaypointsInfo'
          component={WaypointsInfoScreen}
        />
        <RootStack.Screen name='RouteInfo' component={RouteInfoScreen} />
        <RootStack.Screen name='Streak' component={StreakScreen} />
        <RootStack.Screen name='RestDay' component={RestDayScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}
