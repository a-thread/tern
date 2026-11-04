import { act, renderHook } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { useDrinkCelebration } from './useDrinkCelebration';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success' },
}));

describe('useDrinkCelebration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('taps for an ordinary drink', () => {
    const { result } = renderHook(() => useDrinkCelebration());
    act(() => result.current(false, null));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Medium,
    );
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('buzzes success for the drink that reaches the goal', () => {
    const { result } = renderHook(() => useDrinkCelebration());
    act(() => result.current(true, null));
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('still buzzes outside a splash layer', () => {
    const { result } = renderHook(() => useDrinkCelebration());
    expect(() => act(() => result.current(false, null))).not.toThrow();
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });
});
