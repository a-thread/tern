import { Platform } from 'react-native';
import {
  NO_SUBSCRIPTION,
  Plan,
  type PlanOption,
  SubscriptionConfig,
  type SubscriptionStatus,
} from './models/subscription';
import type { SubscriptionRepository } from './subscription.repository';

type Entitlement = {
  isActive: boolean;
  willRenew: boolean;
  expirationDate: string | null;
};
type CustomerInfo = { entitlements: { active: Record<string, Entitlement> } };
type StorePackage = {
  identifier: string;
  packageType: string;
  product: { priceString: string; price: number; currencyCode: string };
};

/**
 * The little of `react-native-purchases` Tern uses. Small on purpose, so the adapter tests
 * without the native module, like `HealthKitApi`.
 */
export interface PurchasesApi {
  configure(options: { apiKey: string }): void;
  getCustomerInfo(): Promise<CustomerInfo>;
  getOfferings(): Promise<{
    current: { availablePackages: StorePackage[] } | null;
  }>;
  purchasePackage(pkg: StorePackage): Promise<{ customerInfo: CustomerInfo }>;
  restorePurchases(): Promise<CustomerInfo>;
  logIn(appUserID: string): Promise<{ customerInfo: CustomerInfo }>;
  logOut(): Promise<CustomerInfo>;
  isAnonymous(): Promise<boolean>;
  addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void): void;
  removeCustomerInfoUpdateListener(
    listener: (info: CustomerInfo) => void,
  ): boolean;
}

const PLANS: Record<string, Plan> = {
  MONTHLY: Plan.Monthly,
  ANNUAL: Plan.Annual,
};

// Tern Plus is a subscription only. A lifetime package left in the offering is never shown.
const NOT_OFFERED = new Set(['LIFETIME']);

export function statusFrom(info: CustomerInfo): SubscriptionStatus {
  const plus = info.entitlements.active[SubscriptionConfig.ENTITLEMENT];
  if (!plus?.isActive) return NO_SUBSCRIPTION;
  return {
    active: true,
    renews: plus.willRenew,
    expiresAt: plus.expirationDate,
  };
}

const optionFrom = (pkg: StorePackage): PlanOption => ({
  id: pkg.identifier,
  plan: PLANS[pkg.packageType] ?? Plan.Other,
  price: pkg.product.priceString,
  amount: pkg.product.price,
  currency: pkg.product.currencyCode,
});

/** Tern Plus through RevenueCat, which handles Google Play Billing and the App Store. */
export function createRevenueCatSubscriptionRepository(
  api: PurchasesApi,
  apiKey: string,
): SubscriptionRepository {
  api.configure({ apiKey });

  const packages = async () =>
    ((await api.getOfferings()).current?.availablePackages ?? []).filter(
      (p) => !NOT_OFFERED.has(p.packageType),
    );

  return {
    status: async () => statusFrom(await api.getCustomerInfo()),
    plans: async () => (await packages()).map(optionFrom),
    async purchase(id) {
      const pkg = (await packages()).find((p) => p.identifier === id);
      if (!pkg) throw new Error(`No plan ${id}`);
      try {
        return statusFrom((await api.purchasePackage(pkg)).customerInfo);
      } catch (error) {
        // Backing out of the store's sheet is a choice, not a failure.
        if ((error as { userCancelled?: boolean }).userCancelled) return null;
        throw error;
      }
    },
    restore: async () => statusFrom(await api.restorePurchases()),
    async identify(userId) {
      if (userId) return statusFrom((await api.logIn(userId)).customerInfo);
      // Logging out an anonymous user is an error in RevenueCat; there's nothing to undo.
      if (await api.isAnonymous()) return statusFrom(await api.getCustomerInfo());
      return statusFrom(await api.logOut());
    },
    onChange(listener) {
      const handle = (info: CustomerInfo) => listener(statusFrom(info));
      api.addCustomerInfoUpdateListener(handle);
      return () => {
        api.removeCustomerInfoUpdateListener(handle);
      };
    },
  };
}

/**
 * The store's Tern Plus, or null without a RevenueCat key for this platform (then the
 * memory version stands in). Needs a dev build: Expo Go can't load the native module.
 */
export function createStoreSubscriptionRepository(): SubscriptionRepository | null {
  // Written out in full so Expo can inline them.
  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (!apiKey) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Purchases = require('react-native-purchases').default as PurchasesApi;
  return createRevenueCatSubscriptionRepository(Purchases, apiKey);
}
