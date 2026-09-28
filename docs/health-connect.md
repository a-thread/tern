# Steps and Health Connect

Steps are read on the device and never uploaded. In local (no-keys) mode and the guest
preview the app shows sample steps. With an account and no step source, steps stay at
zero and no step waypoints are awarded — sample data would earn a real account waypoints
it didn't earn.

The adapter is [`src/today/steps.healthconnect.ts`](../src/today/steps.healthconnect.ts).
It stays off unless `EXPO_PUBLIC_HEALTH_CONNECT=1`, and has been verified by manual
testing on an Android device.

## Turning it on

Health Connect is a native module, so Expo Go can't load it. You need a dev client.

1. `.env` has `EXPO_PUBLIC_HEALTH_CONNECT=1` (the adapter stays off without it).
2. `npx expo prebuild` then `npx expo run:android`, with a device or emulator that has
   Health Connect — built in on Android 14+, a Play Store app before that. Or build one:
   `eas build --profile development --platform android`.
3. In the app: Settings → Health data → _Connect Health Connect_.

> The `development` profile in `eas.json` sets `developmentClient: true`, but
> `expo-dev-client` is not a dependency yet. Run `npx expo install expo-dev-client`
> before using that profile, or the build won't give you a working dev client.

## What's already configured

The package, its config plugin, the `READ_STEPS` permission and the Android build
settings (minSdk 26) are set up in `package.json` and `app.json`. The config plugin adds
both the rationale intent and the Android 14 permission-usage alias, which Health Connect
requires.

`react-native-health-connect` 4.x needs compileSdk 35+, which Expo SDK 54 provides. The
app targets API 36, as Google Play requires.

## Rules of thumb

- **Declare only the permissions you actually read.** Google Play reviews every declared
  health permission, and each one is something you have to justify.
- **Always keep the manual step-entry path working.** Permissions fail often enough that
  they can't be the only route into the app.

## Troubleshooting

"Not available in this build" means the flag is off or the module didn't load. If step
counts look wrong, check the `aggregateGroupByPeriod` call against the library docs.

## iOS

HealthKit (`react-native-health`) is not wired up. Steps are Android-only for now.
