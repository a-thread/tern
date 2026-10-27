import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { WelcomeStackParamList } from '../navigation/types';
import { WizardStep } from './models/wizardSteps';
import IntroScreen from './intro/IntroScreen';
import TrackScreen from './track/TrackScreen';
import StepsScreen from './steps/StepsScreen';
import FoodStyleScreen from './food-style/FoodStyleScreen';
import CalorieTargetScreen from './calorie-target/CalorieTargetScreen';
import TargetZoneScreen from './target-zone/TargetZoneScreen';
import AccountScreen from './account/AccountScreen';
import RemindersStepScreen from './reminders/RemindersStepScreen';

const Stack = createNativeStackNavigator<WelcomeStackParamList>();

/**
 * The setup wizard for a new install. A stack, so swiping back (or Android's back button) goes to
 * the previous screen. Only mounted until it's finished or skipped; see `RootNavigator`.
 */
export default function WelcomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={WizardStep.Intro} component={IntroScreen} />
      <Stack.Screen name={WizardStep.Track} component={TrackScreen} />
      <Stack.Screen name={WizardStep.Steps} component={StepsScreen} />
      <Stack.Screen name={WizardStep.FoodStyle} component={FoodStyleScreen} />
      <Stack.Screen
        name={WizardStep.CalorieTarget}
        component={CalorieTargetScreen}
      />
      <Stack.Screen name={WizardStep.TargetZone} component={TargetZoneScreen} />
      <Stack.Screen name={WizardStep.Account} component={AccountScreen} />
      <Stack.Screen
        name={WizardStep.Reminders}
        component={RemindersStepScreen}
      />
    </Stack.Navigator>
  );
}
