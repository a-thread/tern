# Steps and workouts on iPhone (Apple Health)

On iPhone Tern reads **steps** and **workouts** from Apple Health. Both are read on the device and
never uploaded, and Tern never writes to Apple Health. The Android equivalent is
[health-connect.md](health-connect.md); both sit behind the same Health data screen.

The adapters are
[`steps.healthkit.ts`](../src/domain/activity/steps.healthkit.ts) and
[`movement.healthkit.ts`](../src/domain/movement/movement.healthkit.ts). They talk to HealthKit through
the small interface in [`healthkit.ts`](../src/domain/health/healthkit.ts), which wraps
`@kingstinct/react-native-healthkit` (pinned to 16.2.0, with `react-native-nitro-modules`). The
selectors `steps.health.ts` and `movement.health.ts` pick HealthKit on iPhone and Health Connect on
Android, and `BackendContext` uses those.

## Status

- Verified here: types, lint, the 748 Jest tests (mapping, permission status, platform selection),
  and that the Expo config resolves to the right `Info.plist` keys and entitlement
  (`npx expo config --type introspect`).
- **Not yet verified on a device:** the app has not been built or run on an iPhone. `newArchEnabled`
  is `false` and the HealthKit library is built on Nitro Modules; its docs don't say outright that Nitro
  works on the old architecture, so the first dev build is the real test. If it fails, the fallback is
  `react-native-health` (old-architecture friendly, but little maintained) behind the same
  `HealthKitApi`, so only `createHealthKitApi` changes.

## Turning it on

HealthKit is a native module, so Expo Go can't load it, and it needs a real device for real data (the
Simulator has no step history).

1. `.env` has `EXPO_PUBLIC_HEALTH=1`.
2. Build a development client. This needs the Apple Developer Program (see [RELEASING.md](RELEASING.md#iphone)):
   `eas build --profile development --platform ios`, then install it on your iPhone.
3. In the app: Settings > Health data > _Connect Apple Health_, and switch on Steps and Workouts in the sheet.

## What it reads

- **Steps:** one total per local day, from a HealthKit statistics query, so iPhone and Apple Watch
  samples are merged the way the Health app does it, not added up.
- **Workouts:** start, end and type. Each becomes read-only movement on the day it started
  (`workoutToEntry`); the type is mapped from Apple's workout numbering (`activityForWorkoutType`),
  and anything unknown shows as "Other".
- Nothing else. Tern asks for read access to steps and workouts only, and doesn't request write access.

## One thing that works differently from Android

HealthKit won't tell an app whether _read_ access was denied (it protects people from having a
condition inferred from the answer). So Tern can only tell "the permission sheet hasn't been shown"
(needs permission) from "it has" (connected); a refusal just reads as zero steps. When the past week
is all zeros, the Health data screen says so and links to the iPhone's Settings, where the person can
turn Steps on under Health > Data Access & Devices > Tern. Manual entry keeps working either way.

## Notifications

iOS keeps only the 64 soonest local notifications and drops the rest silently, so the rotating meal
reminders shorten their window to fit (`rotationDays` in `reminderPlan.ts`).

## App Store notes (for later)

- Review guideline 5.1.3: health data is used only to show the person their own movement. Not for
  advertising, not stored in iCloud, not shared. Say so in the review notes.
- Declare the capability on the App ID (EAS does it from the entitlement) and answer the App Privacy
  questions to match [index.html](index.html) (health data is read on the device, not collected).
- `NSHealthShareUsageDescription` is in `app.json`; there is deliberately no update description.
