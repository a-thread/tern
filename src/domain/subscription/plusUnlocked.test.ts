import eas from '../../../eas.json';
import { createSubscriptionRepository } from '../../BackendContext';
import { plusUnlocked } from './plusUnlocked';
import { devSupporter } from './devSupporter';

type Profile = { extends?: string; env?: Record<string, string> };
const profiles = eas.build as Record<string, Profile>;

/** A build profile's environment, with what it extends underneath. */
const envOf = (name: string): Record<string, string> => {
  const profile = profiles[name];
  return {
    ...(profile.extends ? envOf(profile.extends) : {}),
    ...profile.env,
  };
};

describe('Tern Plus unlocked for test builds', () => {
  const before = process.env.EXPO_PUBLIC_PLUS_UNLOCKED;
  afterEach(() => {
    // Assigning undefined would store the string "undefined".
    if (before === undefined) delete process.env.EXPO_PUBLIC_PLUS_UNLOCKED;
    else process.env.EXPO_PUBLIC_PLUS_UNLOCKED = before;
  });

  it('is unlocked in the preview build that testers install directly', () => {
    expect(envOf('preview').EXPO_PUBLIC_PLUS_UNLOCKED).toBe('1');
  });

  it('is never unlocked in a store build', () => {
    expect(envOf('production').EXPO_PUBLIC_PLUS_UNLOCKED).toBeUndefined();
  });

  it('turns Plus on with nothing bought', async () => {
    process.env.EXPO_PUBLIC_PLUS_UNLOCKED = '1';
    expect(plusUnlocked()).toBe(true);
    expect((await createSubscriptionRepository().status()).active).toBe(true);
  });

  it('leaves Plus to the store otherwise', async () => {
    delete process.env.EXPO_PUBLIC_PLUS_UNLOCKED;
    expect(plusUnlocked()).toBe(false);
    expect((await createSubscriptionRepository().status()).active).toBe(false);
  });
});

describe('Tern Plus without a store key', () => {
  const before = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  const beforeAndroid = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_PLUS_UNLOCKED;
    delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  });
  afterEach(() => {
    if (before !== undefined)
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = before;
    if (beforeAndroid !== undefined)
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY = beforeAndroid;
  });

  it('never counts a signed-in account as having Plus in a release build', async () => {
    const repo = createSubscriptionRepository(false);
    expect((await repo.identify('user-1')).active).toBe(false);
    expect(await repo.plans()).toEqual([]);
    await expect(repo.purchase('sample_annual')).rejects.toThrow();
  });

  it('lets development against Supabase treat accounts as having Plus', async () => {
    delete process.env.EXPO_PUBLIC_DEV_SUPPORTER;
    const repo = createSubscriptionRepository(true);
    const status = await repo.identify('user-1');
    expect(status.active).toBe(true);
    expect(status.supporter).toBe(false);
  });

  describe('with EXPO_PUBLIC_DEV_SUPPORTER', () => {
    const beforeSupporter = process.env.EXPO_PUBLIC_DEV_SUPPORTER;
    afterEach(() => {
      if (beforeSupporter === undefined)
        delete process.env.EXPO_PUBLIC_DEV_SUPPORTER;
      else process.env.EXPO_PUBLIC_DEV_SUPPORTER = beforeSupporter;
    });

    it('treats accounts as Supporters in development', async () => {
      process.env.EXPO_PUBLIC_DEV_SUPPORTER = '1';
      expect(devSupporter()).toBe(true);
      const status =
        await createSubscriptionRepository(true).identify('user-1');
      expect(status.supporter).toBe(true);
    });

    it('never makes anyone a Supporter in a release build', async () => {
      process.env.EXPO_PUBLIC_DEV_SUPPORTER = '1';
      const status =
        await createSubscriptionRepository(false).identify('user-1');
      expect(status.active).toBe(false);
    });

    it('is never set in an EAS build', () => {
      for (const name of Object.keys(profiles)) {
        expect(envOf(name).EXPO_PUBLIC_DEV_SUPPORTER).toBeUndefined();
      }
    });
  });

  it('keeps a Supporter plan bought in development through signing in', async () => {
    delete process.env.EXPO_PUBLIC_DEV_SUPPORTER;
    const repo = createSubscriptionRepository(true);
    await repo.purchase('sample_supporter');
    expect((await repo.identify('user-1')).supporter).toBe(true);
  });
});
