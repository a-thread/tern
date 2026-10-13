# Releasing Tern

Builds run on EAS (Expo), started from GitHub Actions. App id: `com.purlieus.tern`,
Expo owner `purlieus-systems`.

## One-time setup

1. Add the GitHub secret `EXPO_TOKEN` (expo.dev > Account settings > Access tokens).
2. EAS environment variables (`preview` and `production`): `EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_USDA_API_KEY`.
3. Run the first Android build by hand so EAS creates the keystore, then back it up:
   `npx eas-cli build -p android --profile production` and `npx eas-cli credentials`.
4. Play Console: create the app, upload the first AAB manually (Google requires it), fill the
   listing, data safety and Health Connect declarations, host `docs/index.html` (GitHub Pages).
5. For automatic submission: add a Google Play service-account key to EAS credentials. The
   track is already `internal` in `eas.json` — change it there to send builds somewhere else.

## Every release

1. Merge to `main` (CI runs typecheck, lint and tests).
2. `npm version patch` (bumps `package.json`, commits and tags `vX.Y.Z`), then set the same
   `version` in `app.json`.
3. `git push --follow-tags`. The tag starts a **production** Android build.
4. Follow the build on expo.dev; promote it in the Play Console.

Test build: Actions > Build > Run workflow > `preview` / `android` gives an installable APK.
Tick "submit" (production only) to send the build to the store once step 5 above is done.

## iPhone

Not shipped yet. Everything in the repo is ready for a first build; what's left needs an Apple
Developer Program membership ($99/year), because nothing but Expo Go can run on a real iPhone
without one, and Expo Go can't load Apple Health.

One-time setup:

1. Join the Apple Developer Program, then create the app in App Store Connect with bundle id
   `com.purlieus.tern`. Note its numeric Apple ID and put it in `eas.json` as
   `submit.production.ios.ascAppId`.
2. `npx eas-cli credentials -p ios`: EAS creates the distribution certificate and provisioning profile,
   and enables the HealthKit capability on the App ID from the entitlement in `app.json`.
3. Register your iPhone for development builds: `npx eas-cli device:create`.

First build and check (see [healthkit.md](healthkit.md) for what to look at):

1. `eas build --profile development --platform ios`, install on the iPhone, run the app with `npx expo start --dev-client`.
2. Settings > Health data > Connect Apple Health. Steps for the last week should match the Health app,
   including a day with both iPhone and Watch data. Workouts should show as read-only movement.
3. Check reminders, the barcode scanner, sign-in and the password-reset link.

TestFlight:

1. `eas build --profile production --platform ios --auto-submit` (or Actions > Build > `ios`, tick submit).
2. In App Store Connect > TestFlight, add testers to an internal group. Builds expire after 90 days.

App Store: screenshots, the privacy policy URL (`docs/index.html`), App Privacy answers, and review
notes explaining the HealthKit use (guideline 5.1.3).
