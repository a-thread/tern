/**
 * Whether this build should try to read the phone's health app (Health Connect on Android,
 * Apple Health on iPhone). Off unless `EXPO_PUBLIC_HEALTH=1`; the older name
 * `EXPO_PUBLIC_HEALTH_CONNECT=1` still works. Both are written out in full so Expo can inline them.
 */
export const healthEnabled = () =>
  process.env.EXPO_PUBLIC_HEALTH === '1' || process.env.EXPO_PUBLIC_HEALTH_CONNECT === '1';
