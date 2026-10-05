import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, render } from '@testing-library/react-native';

import LoadingBird from './LoadingBird';
import LoadingScreen from './LoadingScreen';

afterEach(() => jest.restoreAllMocks());

describe('LoadingScreen', () => {
  it('has one bird that says it is loading, with more crossing the sky for show', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const { getAllByRole, UNSAFE_getAllByType } = render(<LoadingScreen />);
    await act(async () => {});
    // Only the main bird is announced; the rest are scenery.
    expect(getAllByRole('progressbar')).toHaveLength(1);
    expect(UNSAFE_getAllByType(LoadingBird).length).toBeGreaterThan(1);
  });

  it('is the one bird, still, when reduce motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { UNSAFE_getAllByType } = render(<LoadingScreen />);
    await act(async () => {});
    expect(UNSAFE_getAllByType(LoadingBird)).toHaveLength(1);
  });
});
