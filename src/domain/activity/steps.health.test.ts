import { Platform } from 'react-native';

import { createHealthStepsRepository } from './steps.health';
import { createHealthWorkouts } from '../movement/movement.health';

describe('the phone health source', () => {
  const flag = process.env.EXPO_PUBLIC_HEALTH;
  afterEach(() => {
    jest.restoreAllMocks();
    process.env.EXPO_PUBLIC_HEALTH = flag;
  });

  it.each(['ios', 'android'] as const)('is null on %s when the health flag is off', (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    process.env.EXPO_PUBLIC_HEALTH = '';
    expect(createHealthStepsRepository()).toBeNull();
    expect(createHealthWorkouts()).toBeNull();
  });

  it('is null on other platforms', () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    process.env.EXPO_PUBLIC_HEALTH = '1';
    expect(createHealthStepsRepository()).toBeNull();
    expect(createHealthWorkouts()).toBeNull();
  });
});
