import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { Plan } from './models/subscription';
import { createMemorySubscriptionRepository } from './subscription.repository';
import { SubscriptionProvider, useSubscription } from './SubscriptionContext';

function setup(
  repo = createMemorySubscriptionRepository(),
  userId: string | null = null,
  serverGrant?: () => Promise<boolean>,
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SubscriptionProvider repo={repo} userId={userId} serverGrant={serverGrant}>
      {children}
    </SubscriptionProvider>
  );
  return renderHook(() => useSubscription(), { wrapper });
}

describe('SubscriptionContext', () => {
  it('starts without Plus, with the plans yearly first', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.active).toBe(false);
    expect(result.current.plans[0].plan).toBe(Plan.Annual);
  });

  it('turns Plus on once a plan is bought', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.ready).toBe(true));
    let bought = false;
    await act(async () => {
      bought = await result.current.purchase(result.current.plans[0].id);
    });
    expect(bought).toBe(true);
    expect(result.current.active).toBe(true);
  });

  it('stays off when the person backs out of buying', async () => {
    const repo = createMemorySubscriptionRepository();
    repo.purchase = async () => null;
    const { result } = setup(repo);
    await waitFor(() => expect(result.current.ready).toBe(true));
    let bought = true;
    await act(async () => {
      bought = await result.current.purchase('sample_annual');
    });
    expect(bought).toBe(false);
    expect(result.current.active).toBe(false);
  });

  it("reads the signed-in account's status", async () => {
    const repo = createMemorySubscriptionRepository();
    const identify = jest
      .spyOn(repo, 'identify')
      .mockResolvedValue({ active: true, renews: true, expiresAt: null });
    const { result } = setup(repo, 'user-1');
    await waitFor(() => expect(result.current.active).toBe(true));
    expect(identify).toHaveBeenCalledWith('user-1');
  });

  it('counts Plus granted on the server when the store has no purchase', async () => {
    const repo = createMemorySubscriptionRepository();
    let listener: (s: { active: boolean; renews: boolean; expiresAt: null }) => void = () => {};
    repo.onChange = (l) => {
      listener = l;
      return () => {};
    };
    const { result } = setup(repo, 'user-1', async () => true);
    await waitFor(() => expect(result.current.active).toBe(true));
    expect(result.current.known).toBe(true);
    // The store saying "no" later doesn't take a grant away.
    act(() => listener({ active: false, renews: false, expiresAt: null }));
    expect(result.current.active).toBe(true);
  });

  it('is lapsed only when the store and the server both say no', async () => {
    const { result } = setup(createMemorySubscriptionRepository(), 'user-1', async () => false);
    await waitFor(() => expect(result.current.checkedFor).toBe('user-1'));
    expect(result.current.active).toBe(false);
    expect(result.current.known).toBe(true);
  });

  it("treats a server that can't be reached as unknown, not lapsed", async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = setup(createMemorySubscriptionRepository(), 'user-1', async () => {
      throw new Error('offline');
    });
    await waitFor(() => expect(result.current.checkedFor).toBe('user-1'));
    expect(result.current.known).toBe(false);
    warn.mockRestore();
  });

  it('does not ask the server when the store already has Plus', async () => {
    const serverGrant = jest.fn(async () => false);
    const repo = createMemorySubscriptionRepository({ active: true, renews: true, expiresAt: null });
    const { result } = setup(repo, 'user-1', serverGrant);
    await waitFor(() => expect(result.current.active).toBe(true));
    expect(serverGrant).not.toHaveBeenCalled();
  });

  it('still counts the status when the plans cannot be loaded', async () => {
    const repo = createMemorySubscriptionRepository({
      active: true,
      renews: true,
      expiresAt: null,
    });
    repo.plans = async () => {
      throw new Error('offline');
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = setup(repo);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.active).toBe(true);
    expect(result.current.plans).toEqual([]);
    warn.mockRestore();
  });
});
