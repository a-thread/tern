import { Platform } from 'react-native';
import { createHealthConnectStepsRepository } from './steps.healthconnect';
import { createHealthKitStepsRepository } from './steps.healthkit';
import type { StepsRepository } from './steps.repository';

/** The phone's own step source: Apple Health on iPhone, Health Connect on Android; null where there isn't one. */
export function createHealthStepsRepository(): StepsRepository | null {
  return Platform.OS === 'ios'
    ? createHealthKitStepsRepository()
    : createHealthConnectStepsRepository();
}
