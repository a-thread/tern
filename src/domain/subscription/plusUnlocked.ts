/**
 * Tern Plus is on for everyone using this build, with nothing bought: for test builds
 * handed out directly (the `preview` APK), which Google Play Billing can't sell to, since
 * it only works for apps installed from Play. On when `EXPO_PUBLIC_PLUS_UNLOCKED=1`, set
 * in `eas.json` for `preview` only; a test keeps it out of `production`. Written out in
 * full so Expo can inline it.
 */
export const plusUnlocked = () => process.env.EXPO_PUBLIC_PLUS_UNLOCKED === '1';
