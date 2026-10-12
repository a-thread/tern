import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import type { MovementStackParamList } from '@/movement/navigation';
import ExercisesScreen from '@/movement/exercises/ExercisesScreen';
import ExerciseDetailScreen from '@/movement/exercise-detail/ExerciseDetailScreen';

const Stack = createNativeStackNavigator<MovementStackParamList>();

type Props = NativeStackScreenProps<RootStackParamList, 'LogMovement'>;

/** Presented modally from the root stack: pick an exercise, then its details. */
export default function MovementStack({ route }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='Exercises' component={ExercisesScreen} initialParams={route.params ?? {}} />
      <Stack.Screen name='ExerciseDetail' component={ExerciseDetailScreen} />
    </Stack.Navigator>
  );
}
