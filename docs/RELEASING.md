# Releasing Tern

Builds run on GitHub Actions runners with `eas build --local`, so they don't use the EAS build
quota; EAS still holds the signing credentials and the build numbers. App id:
`com.purlieus.tern`, Expo owner `purlieus-systems`.

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

Releases are automatic ([release.yml](../.github/workflows/release.yml)). Merge a PR whose title
is a conventional commit (the `PR title` check enforces it):

| Title                                                       | Release                       |
| ----------------------------------------------------------- | ----------------------------- |
| `fix: …`, `fix(deps): …`, `perf: …`                         | patch, 0.1.2 → 0.1.3          |
| `feat: …`                                                   | minor, 0.1.2 → 0.2.0          |
| `feat!: …` or a `BREAKING CHANGE:` footer                   | major (minor while below 1.0) |
| `chore`, `ci`, `docs`, `refactor`, `test`, `style`, `build` | none                          |

On each push to `main` the workflow runs typecheck, lint and tests, works out the version from
the commits since the last `v*` tag, builds, uploads to the Play internal track (and TestFlight
once iOS is on), and only then creates the `vX.Y.Z` tag and GitHub release with notes from the
PR titles. A failed release leaves no tag, so the next merge retries with everything since the
last one. Merges that land during a release are picked up by the next run.

The version comes from the tag, through `APP_VERSION` in [app.config.ts](../app.config.ts);
`app.json`'s `version` is only the local fallback. Build numbers come from EAS.

What stays with you: promoting a build from internal testing to production in the Play Console,
after trying it on a phone.

Test build: Actions > Release > Run workflow gives an installable preview APK (it never submits).
Tern Plus is unlocked in it (`EXPO_PUBLIC_PLUS_UNLOCKED`), since Play Billing can't sell to an
app that wasn't installed from Play; Settings says "test build" at the foot. A test fails if
`production` ever sets it.

## Testers and Tern Plus

- **Preview APK:** Plus is already on, with nothing bought. Send the APK.
- **Play internal testing** (the production build, installed from Play): add the tester's
  Google account under Play Console > Settings > License testing. Their purchases are test
  purchases that charge nothing (subscriptions renew every few minutes and end after a few
  renewals), and RevenueCat grants `plus` from them as usual, marked as sandbox.
- **TestFlight:** purchases there are sandbox purchases and charge nothing.
- **One account, by hand:** in RevenueCat, open the customer (their Tern user id once signed
  in) and grant the `plus` entitlement as a promotional one, for a set time or for good. The
  app asks the server to look the account up each time it opens, so the grant reaches
  Supabase too.

The server checks Plus as well (see [supabase/README.md](../supabase/README.md#tern-plus)): an
account can only be written to with a `tern.entitlements` row. Store and promotional
purchases get one automatically. **Preview APK testers don't**, since nothing was bought:
once they've made an account, grant them Plus in RevenueCat as above, or add the row by hand:

```sql
insert into tern.entitlements (user_id, source) values ('<their user id>', 'manual');
```

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

1. Set the repository variable `IOS_RELEASES` to `true`. From then on every release also builds
   iOS and uploads it to TestFlight (it fails early if `ascAppId` is missing).
2. In App Store Connect > TestFlight, add testers to an internal group. Builds expire after 90 days.

App Store: screenshots, the privacy policy URL (`docs/index.html`), App Privacy answers, and review
notes explaining the HealthKit use (guideline 5.1.3).
