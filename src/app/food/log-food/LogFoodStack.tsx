import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/shared/navigation/types';
import LogFoodScreen from '@/food/log-food/search/LogFoodScreen';
import BarcodeScanScreen from '@/food/log-food/barcode-scan/BarcodeScanScreen';
import FoodDetailScreen from '@/food/log-food/food-detail/FoodDetailScreen';
import ManualFoodEntryScreen from '@/food/log-food/manual-entry/ManualFoodEntryScreen';
import SavedMealScreen from '@/food/log-food/saved-meal/SavedMealScreen';
import RecentMealScreen from '@/food/log-food/recent-meal/RecentMealScreen';
import MealEditorScreen from '@/food/log-food/meal-editor/MealEditorScreen';
import MealReviewScreen from '@/food/log-food/meal-review/MealReviewScreen';
import type { LogFoodStackParamList } from '@/food/log-food/navigation';

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
      <Stack.Screen name='MealReview' component={MealReviewScreen} />
    </Stack.Navigator>
  );
}
