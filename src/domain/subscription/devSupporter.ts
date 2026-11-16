/**
 * Development without a RevenueCat key: signed-in accounts count as Tern Plus Supporter
 * rather than plain Plus, so the Supporter thank-you (the trail colour) can be tried and
 * survives a reload. On when `EXPO_PUBLIC_DEV_SUPPORTER=1` in `.env`. Only the free
 * in-memory store reads it, which a release build never uses. Written out in full so Expo
 * can inline it.
 */
export const devSupporter = () => process.env.EXPO_PUBLIC_DEV_SUPPORTER === '1';
