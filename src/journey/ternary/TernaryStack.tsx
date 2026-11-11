import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { TernaryStackParamList } from './navigation';
import TernaryHomeScreen from './TernaryHomeScreen';
import StopoverTableScreen from './stopover-table/StopoverTableScreen';
import PostcardsScreen from './postcards/PostcardsScreen';
import TernarySettingsScreen from './settings/TernarySettingsScreen';
import AboutTernaryScreen from './about/AboutTernaryScreen';

const Stack = createNativeStackNavigator<TernaryStackParamList>();

/** Presented modally from the root stack, from the ternary's card on Journey. */
export default function TernaryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='TernaryHome' component={TernaryHomeScreen} />
      <Stack.Screen name='StopoverTable' component={StopoverTableScreen} />
      <Stack.Screen name='Postcards' component={PostcardsScreen} />
      <Stack.Screen name='TernarySettings' component={TernarySettingsScreen} />
      <Stack.Screen name='AboutTernary' component={AboutTernaryScreen} />
    </Stack.Navigator>
  );
}
