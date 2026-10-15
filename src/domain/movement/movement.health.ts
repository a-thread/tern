import { Platform } from 'react-native';
import {
  createHealthConnectWorkouts,
  type WorkoutsSource,
} from './movement.healthconnect';
import { createHealthKitWorkouts } from './movement.healthkit';

/** Workouts from the phone's own health app: Apple Health on iPhone, Health Connect on Android; null where there isn't one. */
export function createHealthWorkouts(): WorkoutsSource | null {
  return Platform.OS === 'ios'
    ? createHealthKitWorkouts()
    : createHealthConnectWorkouts();
}
