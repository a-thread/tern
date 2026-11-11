import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { TernaryStackParamList } from './navigation';
import TernaryHomeScreen from './TernaryHomeScreen';
import RecipeSwapScreen from './recipe-swap/RecipeSwapScreen';
import RecipeScreen from './recipe-swap/recipe/RecipeScreen';
import PostcardsScreen from './postcards/PostcardsScreen';
import TernarySettingsScreen from './settings/TernarySettingsScreen';
import AboutTernaryScreen from './about/AboutTernaryScreen';

const Stack = createNativeStackNavigator<TernaryStackParamList>();

/** Presented modally from the root stack, from the ternary's card on Journey. */
export default function TernaryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='TernaryHome' component={TernaryHomeScreen} />
      <Stack.Screen name='RecipeSwap' component={RecipeSwapScreen} />
      <Stack.Screen name='Recipe' component={RecipeScreen} />
      <Stack.Screen name='Postcards' component={PostcardsScreen} />
      <Stack.Screen name='TernarySettings' component={TernarySettingsScreen} />
      <Stack.Screen name='AboutTernary' component={AboutTernaryScreen} />
    </Stack.Navigator>
  );
}
