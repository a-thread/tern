import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { Plan } from './models/subscription';
import { createMemorySubscriptionRepository } from './subscription.repository';
import { SubscriptionProvider, useSubscription } from './SubscriptionContext';

function setup(
  repo = createMemorySubscriptionRepository(),
  userId: string | null = null,
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SubscriptionProvider repo={repo} userId={userId}>
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
