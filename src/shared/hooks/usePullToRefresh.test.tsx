import React from 'react';
import { ScrollView } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { usePullToRefresh } from './usePullToRefresh';

function List({ refreshers }: { refreshers: (() => Promise<unknown>)[] }) {
  const refreshControl = usePullToRefresh(refreshers);
  return <ScrollView testID='list' refreshControl={refreshControl} />;
}

const control = () => screen.getByTestId('list').props.refreshControl;

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

describe('usePullToRefresh', () => {
  it('runs every refresher and spins until all have settled', async () => {
    const slow = deferred();
    const a = jest.fn(() => slow.promise);
    const b = jest.fn(() => Promise.resolve());
    render(<List refreshers={[a, b]} />);

    expect(control().props.refreshing).toBe(false);
    let pull!: Promise<void>;
    act(() => {
      pull = control().props.onRefresh();
    });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(control().props.refreshing).toBe(true);

    await act(async () => {
      slow.resolve();
      await pull;
    });
    expect(control().props.refreshing).toBe(false);
  });

  it('stops spinning when a refresher fails', async () => {
    const failing = jest.fn(() => Promise.reject(new Error('offline')));
    render(<List refreshers={[failing]} />);
    await act(() => control().props.onRefresh());
    expect(control().props.refreshing).toBe(false);
  });

  it('ignores a pull while one is still running', async () => {
    const slow = deferred();
    const a = jest.fn(() => slow.promise);
    render(<List refreshers={[a]} />);

    let first!: Promise<void>;
    act(() => {
      first = control().props.onRefresh();
    });
    act(() => {
      control().props.onRefresh();
    });
    expect(a).toHaveBeenCalledTimes(1);

    await act(async () => {
      slow.resolve();
      await first;
    });
  });
});
