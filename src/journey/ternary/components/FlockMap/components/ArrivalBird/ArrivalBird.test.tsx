import React from 'react';
import { render } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { ArrivalBird } from './ArrivalBird';

jest.mock('@shared/hooks/useReduceMotion', () => ({
  useReduceMotion: () => true,
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
}));

describe('ArrivalBird', () => {
  it('with Reduce Motion, draws nothing but still taps and finishes', () => {
    const onDone = jest.fn();
    const ui = render(<ArrivalBird look={3} onDone={onDone} />);
    expect(ui.toJSON()).toBeNull();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });
});
