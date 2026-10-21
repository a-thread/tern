import { Plan, SubscriptionConfig } from './models/subscription';
import {
  createRevenueCatSubscriptionRepository,
  type PurchasesApi,
} from './subscription.revenuecat';

type Entitlement = {
  isActive: boolean;
  willRenew: boolean;
  expirationDate: string | null;
};

const info = (active: boolean, willRenew = true) => {
  const entitlements: Record<string, Entitlement> = {};
  if (active) {
    entitlements[SubscriptionConfig.ENTITLEMENT] = {
      isActive: true,
      willRenew,
      expirationDate: '2027-10-20T00:00:00Z',
    };
  }
  return { entitlements: { active: entitlements } };
};

const pkg = (identifier: string, packageType: string, priceString: string) => ({
  identifier,
  packageType,
  product: { priceString },
});

function fakeApi(overrides: Partial<PurchasesApi> = {}) {
  const api: jest.Mocked<PurchasesApi> = {
    configure: jest.fn(),
    getCustomerInfo: jest.fn().mockResolvedValue(info(false)),
    getOfferings: jest.fn().mockResolvedValue({
      current: {
        availablePackages: [
          pkg('$rc_monthly', 'MONTHLY', '$3.99'),
          pkg('$rc_annual', 'ANNUAL', '$29.99'),
          pkg('$rc_lifetime', 'LIFETIME', '$59.99'),
          pkg('weekend', 'CUSTOM', '$1.00'),
        ],
      },
    }),
    purchasePackage: jest.fn().mockResolvedValue({ customerInfo: info(true) }),
    restorePurchases: jest.fn().mockResolvedValue(info(false)),
    logIn: jest.fn().mockResolvedValue({ customerInfo: info(true) }),
    logOut: jest.fn().mockResolvedValue(info(false)),
    isAnonymous: jest.fn().mockResolvedValue(false),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn().mockReturnValue(true),
    ...overrides,
  } as jest.Mocked<PurchasesApi>;
  return api;
}

describe('RevenueCat subscription repository', () => {
  it('configures the SDK with the key once', () => {
    const api = fakeApi();
    createRevenueCatSubscriptionRepository(api, 'goog_key');
    expect(api.configure).toHaveBeenCalledWith({ apiKey: 'goog_key' });
  });

  it('reads Plus from the entitlement, and nothing else', async () => {
    const api = fakeApi({
      getCustomerInfo: jest.fn().mockResolvedValue(info(true, false)),
    });
    expect(await createRevenueCatSubscriptionRepository(api, 'k').status()).toEqual({
      active: true,
      renews: false,
      expiresAt: '2027-10-20T00:00:00Z',
    });
  });

  it("offers the current offering's subscriptions as plans, never a lifetime one", async () => {
    const plans = await createRevenueCatSubscriptionRepository(fakeApi(), 'k').plans();
    expect(plans).toEqual([
      { id: '$rc_monthly', plan: Plan.Monthly, price: '$3.99' },
      { id: '$rc_annual', plan: Plan.Annual, price: '$29.99' },
      { id: 'weekend', plan: Plan.Other, price: '$1.00' },
    ]);
  });

  it('will not buy a lifetime package, even by id', async () => {
    await expect(
      createRevenueCatSubscriptionRepository(fakeApi(), 'k').purchase('$rc_lifetime'),
    ).rejects.toThrow('No plan $rc_lifetime');
  });

  it('offers nothing when there is no current offering', async () => {
    const api = fakeApi({ getOfferings: jest.fn().mockResolvedValue({ current: null }) });
    expect(await createRevenueCatSubscriptionRepository(api, 'k').plans()).toEqual([]);
  });

  it('buys the chosen package and returns the new status', async () => {
    const api = fakeApi();
    const status = await createRevenueCatSubscriptionRepository(api, 'k').purchase(
      '$rc_annual',
    );
    expect(api.purchasePackage).toHaveBeenCalledWith(pkg('$rc_annual', 'ANNUAL', '$29.99'));
    expect(status?.active).toBe(true);
  });

  it('treats backing out of the store sheet as a choice, not a failure', async () => {
    const api = fakeApi({
      purchasePackage: jest.fn().mockRejectedValue({ userCancelled: true }),
    });
    expect(
      await createRevenueCatSubscriptionRepository(api, 'k').purchase('$rc_annual'),
    ).toBeNull();
  });

  it('passes a real store failure on', async () => {
    const api = fakeApi({
      purchasePackage: jest.fn().mockRejectedValue(new Error('Billing unavailable')),
    });
    await expect(
      createRevenueCatSubscriptionRepository(api, 'k').purchase('$rc_annual'),
    ).rejects.toThrow('Billing unavailable');
  });

  it('ties purchases to the account on sign-in, and lets go on sign-out', async () => {
    const api = fakeApi();
    const repo = createRevenueCatSubscriptionRepository(api, 'k');
    expect((await repo.identify('user-1')).active).toBe(true);
    expect(api.logIn).toHaveBeenCalledWith('user-1');
    await repo.identify(null);
    expect(api.logOut).toHaveBeenCalled();
  });

  it('does not log out a phone that was never signed in', async () => {
    const api = fakeApi({ isAnonymous: jest.fn().mockResolvedValue(true) });
    await createRevenueCatSubscriptionRepository(api, 'k').identify(null);
    expect(api.logOut).not.toHaveBeenCalled();
    expect(api.getCustomerInfo).toHaveBeenCalled();
  });

  it('reports status changes and stops when unsubscribed', () => {
    const api = fakeApi();
    const listener = jest.fn();
    const stop = createRevenueCatSubscriptionRepository(api, 'k').onChange(listener);
    const handle = api.addCustomerInfoUpdateListener.mock.calls[0][0];
    handle(info(true));
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
    stop();
    expect(api.removeCustomerInfoUpdateListener).toHaveBeenCalledWith(handle);
  });
});
