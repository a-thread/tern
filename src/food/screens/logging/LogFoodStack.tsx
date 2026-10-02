import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@shared/navigation/types';
import LogFoodScreen from './LogFoodScreen';
import BarcodeScanScreen from './BarcodeScanScreen';
import FoodDetailScreen from './FoodDetailScreen';
import ManualFoodEntryScreen from './ManualFoodEntryScreen';
import SavedMealScreen from './SavedMealScreen';
import RecentMealScreen from './RecentMealScreen';
import MealEditorScreen from './MealEditorScreen';
import type { LogFoodStackParamList } from '@food/navigation';

const Stack = createNativeStackNavigator<LogFoodStackParamList>();

type Props = NativeStackScreenProps<RootStackParamList, 'LogFood'>;

/** Presented modally from the root stack; screens inside push/pop normally. */
export default function LogFoodStack({ route }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      <Stack.Screen
        name='Search'
        component={LogFoodScreen}
        initialParams={route.params}
      />
      <Stack.Screen name='BarcodeScan' component={BarcodeScanScreen} />
      <Stack.Screen name='FoodDetail' component={FoodDetailScreen} />
      <Stack.Screen name='ManualFoodEntry' component={ManualFoodEntryScreen} />
      <Stack.Screen name='SavedMeal' component={SavedMealScreen} />
      <Stack.Screen name='RecentMeal' component={RecentMealScreen} />
      <Stack.Screen name='MealEditor' component={MealEditorScreen} />
    </Stack.Navigator>
  );
}
