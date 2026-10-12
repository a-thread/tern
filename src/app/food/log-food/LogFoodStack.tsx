import React from 'react';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import LogFoodScreen from './search/LogFoodScreen';
import BarcodeScanScreen from './barcode-scan/BarcodeScanScreen';
import FoodDetailScreen from './food-detail/FoodDetailScreen';
import ManualFoodEntryScreen from './manual-entry/ManualFoodEntryScreen';
import SavedMealScreen from './saved-meal/SavedMealScreen';
import RecentMealScreen from './recent-meal/RecentMealScreen';
import MealEditorScreen from './meal-editor/MealEditorScreen';
import MealReviewScreen from './meal-review/MealReviewScreen';
import type { LogFoodStackParamList } from './navigation';

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
