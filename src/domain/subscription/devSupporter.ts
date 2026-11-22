/**
 * `EXPO_PUBLIC_DEV_SUPPORTER=1`: without RevenueCat, accounts count as Supporter. Only the
 * in-memory store reads it. Written out in full so Expo can inline it.
 */
export const devSupporter = () => process.env.EXPO_PUBLIC_DEV_SUPPORTER === '1';
