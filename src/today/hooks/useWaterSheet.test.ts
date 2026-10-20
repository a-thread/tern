import { act, renderHook } from '@testing-library/react-native';

import { useWaterSheet } from './useWaterSheet';

describe('useWaterSheet', () => {
  it('counts as showing until the sheet has finished closing, so awards wait for it', () => {
    const { result } = renderHook(() => useWaterSheet());
    expect(result.current.showing).toBe(false);

    act(() => result.current.open());
    expect(result.current.visible).toBe(true);
    expect(result.current.showing).toBe(true);

    act(() => result.current.close());
    expect(result.current.visible).toBe(false);
    expect(result.current.showing).toBe(true); // still sliding away: nothing may open yet

    act(() => result.current.hidden());
    expect(result.current.showing).toBe(false);
  });
});
