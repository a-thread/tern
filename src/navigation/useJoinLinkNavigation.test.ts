import { Linking } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

import type { RootStackParamList } from './types';
import { useJoinLinkNavigation } from './useJoinLinkNavigation';
import { rememberJoin } from './pendingJoin';

type Nav = NavigationContainerRefWithCurrent<RootStackParamList>;

function setup(first: string | null) {
  let onUrl: ((e: { url: string }) => void) | undefined;
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(first);
  jest.spyOn(Linking, 'addEventListener').mockImplementation(((
    _: string,
    cb: (e: { url: string }) => void,
  ) => {
    onUrl = cb;
    return { remove: jest.fn() };
  }) as unknown as typeof Linking.addEventListener);
  const navigate = jest.fn();
  const nav = { isReady: () => true, navigate } as unknown as Nav;
  return { nav, navigate, send: (url: string) => onUrl?.({ url }) };
}

const joinWith = (code: string) => [
  'Ternary',
  { screen: 'JoinTernary', params: { code }, initial: false },
];

describe('useJoinLinkNavigation', () => {
  afterEach(() => jest.restoreAllMocks());

  it('opens Join with the code from the link Tern was opened with', async () => {
    const { nav, navigate } = setup('tern://join/KTW4QP');
    renderHook(() => useJoinLinkNavigation(nav, true));
    await act(async () => {});
    expect(navigate).toHaveBeenCalledWith(...joinWith('KTW4QP'));
  });

  it('waits until the app is ready, and opens a link that arrives later', async () => {
    const { nav, navigate, send } = setup(null);
    const { rerender } = renderHook(
      ({ ready }: { ready: boolean }) => useJoinLinkNavigation(nav, ready),
      { initialProps: { ready: false } },
    );
    await act(async () => {});
    act(() => send('https://purlieus.dev/tern/join/?code=abc234'));
    expect(navigate).not.toHaveBeenCalled();
    rerender({ ready: true });
    expect(navigate).toHaveBeenCalledWith(...joinWith('ABC234'));
  });

  it('opens Join again with a code kept while signing up for Plus', async () => {
    rememberJoin('KTW4QP');
    const { nav, navigate } = setup(null);
    renderHook(() => useJoinLinkNavigation(nav, true));
    await act(async () => {});
    expect(navigate).toHaveBeenCalledWith(...joinWith('KTW4QP'));
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('ignores other links', async () => {
    const { nav, navigate, send } = setup(null);
    renderHook(() => useJoinLinkNavigation(nav, true));
    await act(async () => {});
    act(() => send('tern://today'));
    expect(navigate).not.toHaveBeenCalled();
  });
});
