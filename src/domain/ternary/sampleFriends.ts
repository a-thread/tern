/**
 * Sample friends in your ternary, for trying its screens on a local build: made-up members,
 * fish, postcards and dishes shown alongside your real ternary (`withSampleFriends`), and
 * nothing written to the server for them. On when `EXPO_PUBLIC_SAMPLE_FRIENDS=1` in a local
 * `.env`, and only in a development build (`__DEV__`), so a release can never show them.
 * Written out in full so Expo can inline it.
 */
export const sampleFriends = () =>
  __DEV__ && process.env.EXPO_PUBLIC_SAMPLE_FRIENDS === '1';
