import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TrendsScreen from './TrendsScreen';
import StepsDetailScreen from './StepsDetailScreen';
import WeightDetailScreen from './WeightDetailScreen';
import type { TrendsStackParamList } from './types';

const Stack = createNativeStackNavigator<TrendsStackParamList>();

/** Nested inside the Trends tab so the tab bar stays visible while drilling into detail. */
export default function TrendsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='TrendsHome' component={TrendsScreen} />
      <Stack.Screen name='StepsDetail' component={StepsDetailScreen} />
      <Stack.Screen name='WeightDetail' component={WeightDetailScreen} />
    </Stack.Navigator>
  );
}
