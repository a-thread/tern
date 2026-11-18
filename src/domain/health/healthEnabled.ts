/** `EXPO_PUBLIC_HEALTH=1` (or the older `_HEALTH_CONNECT`). Written out so Expo can inline them. */
export const healthEnabled = () =>
  process.env.EXPO_PUBLIC_HEALTH === '1' ||
  process.env.EXPO_PUBLIC_HEALTH_CONNECT === '1';
