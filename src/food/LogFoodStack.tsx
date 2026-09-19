import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@shared/navigation/types';
import LogFoodScreen from './logging/LogFoodScreen';
import BarcodeScanScreen from './logging/BarcodeScanScreen';
import FoodDetailScreen from './logging/FoodDetailScreen';
import ManualFoodEntryScreen from './logging/ManualFoodEntryScreen';
import type { LogFoodStackParamList } from './types';

const Stack = createNativeStackNavigator<LogFoodStackParamList>();

type Props = NativeStackScreenProps<RootStackParamList, 'LogFood'>;

/** Presented modally from the root stack; screens inside push/pop normally. */
export default function LogFoodStack({ route }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name='Search'
        component={LogFoodScreen}
        initialParams={route.params}
      />
      <Stack.Screen name='BarcodeScan' component={BarcodeScanScreen} />
      <Stack.Screen name='FoodDetail' component={FoodDetailScreen} />
      <Stack.Screen name='ManualFoodEntry' component={ManualFoodEntryScreen} />
    </Stack.Navigator>
  );
}
