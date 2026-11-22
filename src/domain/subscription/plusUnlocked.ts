/**
 * `EXPO_PUBLIC_PLUS_UNLOCKED=1` (the `preview` APK only, which Play Billing can't sell to).
 * Written out in full so Expo can inline it.
 */
export const plusUnlocked = () => process.env.EXPO_PUBLIC_PLUS_UNLOCKED === '1';
