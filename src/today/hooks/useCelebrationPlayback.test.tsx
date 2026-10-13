import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useCelebrationPlayback } from './useCelebrationPlayback';

jest.mock('../../domain/waypoints/WaypointsContext', () => ({
  useWaypoints: () => ({ celebrations: [{ id: 1, points: 10, source: 'rest' }] }),
}));
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

/** A view that reports a fixed place on screen, as measureInWindow does. */
const placed = { measureInWindow: (done: (x: number, y: number, w: number, h: number) => void) => done(10, 20, 100, 50) };

describe('useCelebrationPlayback', () => {
  it('keeps an award waiting while held, then plays it once released', async () => {
    const { result, rerender } = renderHook(({ hold }: { hold: boolean }) => useCelebrationPlayback(hold), {
      initialProps: { hold: true },
    });
    for (const ref of [result.current.rootRef, result.current.heroRef, result.current.chipRef]) {
      (ref as { current: unknown }).current = placed;
    }

    await act(async () => {});
    expect(result.current.playing).toBeNull(); // still held: the tern is flying in

    rerender({ hold: false });
    await waitFor(() => expect(result.current.playing).not.toBeNull());
    expect(result.current.playing?.celebration).toMatchObject({ id: 1, points: 10 });
  });

  it('stays held for as long as it is asked to', async () => {
    const { result, rerender } = renderHook(({ hold }: { hold: boolean }) => useCelebrationPlayback(hold), {
      initialProps: { hold: true },
    });
    for (const ref of [result.current.rootRef, result.current.heroRef, result.current.chipRef]) {
      (ref as { current: unknown }).current = placed;
    }
    rerender({ hold: true });
    rerender({ hold: true });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.playing).toBeNull();
  });
});
