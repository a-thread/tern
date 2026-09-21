# Tern backend

Tern stores its data in Supabase, in a dedicated `tern` schema, so it can share
a project (and its login) with other apps without touching their `public`
tables. With no keys configured, the app runs on local mock data instead.

## Setup

1. **Run the migration.** In the Supabase dashboard open _SQL Editor_ and run
   [`migrations/20260918000000_tern_schema.sql`](migrations/20260918000000_tern_schema.sql)
   (or `supabase db push` if you use the CLI). Then run
   [`migrations/20260919000000_weight_in_pounds.sql`](migrations/20260919000000_weight_in_pounds.sql),
   which switches weight storage from kg to lb, and
   [`migrations/20260920000000_rest_days.sql`](migrations/20260920000000_rest_days.sql),
   which adds the rest-days table, and
   [`migrations/20260921000000_saved_meals.sql`](migrations/20260921000000_saved_meals.sql),
   which adds saved meals.
2. **Expose the schema.** _Project Settings → API → Exposed schemas_ → add `tern`.
   Without this, every request fails with "schema must be one of…".
3. **Add keys.** Copy `.env.example` to `.env` and fill in the project URL and
   the `anon` key (_Project Settings → API_). The anon key is safe to ship in
   the app; row-level security is what protects the data. Never put the
   `service_role` key in `.env`.
4. **Email confirmation.** If the project has _Confirm email_ on, new accounts
   must confirm before signing in (the sign-up screen says so). Turn it off
   under _Authentication → Providers → Email_ while developing if you like.
5. **Allow the app's email links.** Confirmation and password-reset emails open
   the app through a deep link. Under _Authentication → URL Configuration →
   Redirect URLs_ add `tern://**` (a built app) and `exp://**` (Expo Go
   during development). These are additive, so other apps sharing the project
   (e.g. Lichen's web URL) are unaffected. Without them the links fall back to
   the project's Site URL instead of opening Tern.
6. Restart Expo with `npx expo start --clear` so the new env vars are picked up.

## What's stored

| Table                  | Contents                                                               |
| ---------------------- | ---------------------------------------------------------------------- |
| `tern.settings`        | one row per user; the whole settings object as `jsonb`                 |
| `tern.food_entries`    | each logged food, by day and meal                                      |
| `tern.weight_entries`  | each weigh-in, in pounds (kg is a display setting)                     |
| `tern.waypoint_events` | the waypoints ledger: one row per award                                |
| `tern.rest_days`       | the days you chose to rest (one row per day)                           |
| `tern.saved_meals`     | named groups of foods you saved (a snapshot of the items and portions) |

Every table is row-level-secured to `auth.uid()`; signed-out (`anon`) requests
get nothing.

## Waypoints ledger

Waypoints are earned for behavior only. `waypoint_events.source` is restricted
to `steps`, `meals` and `rest`, there is at most one award per source per day
(so awarding is idempotent), and taking one back deletes its row. The total is
the `tern.waypoint_totals` view (the sum of a user's events).

## Steps from Health Connect

Steps are read on the device, not stored on the server. In local (no-keys) mode
and the guest preview the app shows sample steps. With an account and no step
source, steps stay at zero and no step waypoints are awarded — sample data would
earn a real account waypoints it didn't earn.

Health Connect needs a custom dev build (Expo Go can't load native modules).
The adapter is [src/today/steps.healthconnect.ts](../src/today/steps.healthconnect.ts).
The package, its config plugin, the `READ_STEPS` permission and Android build
settings (minSdk 26) are already set up in `package.json` and `app.json`.
A native debug build (`assembleDebug`) succeeds with it, but **the adapter has
not been run on a device.**

`react-native-health-connect` 4.x needs compileSdk 35+, which Expo SDK 54
provides (the app targets API 36, as Google Play requires). Its config plugin
adds both the rationale intent and the Android 14 permission-usage alias.

1. Make sure `.env` has `EXPO_PUBLIC_HEALTH_CONNECT=1` (the adapter stays off without it).
2. `npx expo run:android` with a device or emulator that has Health Connect
   (built in on Android 14+; a Play Store app before that), or an EAS build:
   `eas build --profile development --platform android`.
3. In the app: Settings → Health data → _Connect Health Connect_.

If the app shows "Not available in this build", the flag is off or the module
didn't load. Check the `aggregateGroupByPeriod` call against the library docs
if step counts look wrong.

## Rest days and the streak

You choose rest days from Today ("Take today as a rest day"), within the weekly
allowance in Settings → Rest days. With auto-detect on, a _past_ day that has
some steps but is well under the goal also reads as a rest day (within the same
allowance, chosen days first). Days with no step data are never treated as rest
days. A rest day holds the streak without adding to it. Taking one earns the
rest waypoints; undoing it takes them back quietly.

## Reminders

Two repeating local notifications (no server involved): meals twice a day, and
a weekly weigh-in. Defaults are 12:30 pm and 7:00 pm, and Sundays at 8:00 am;
turn a reminder on in Settings and its times can be changed in 15-minute steps.
They're scheduled on the device ([src/settings/reminders.ts](../src/settings/reminders.ts))
and can't tell whether you've already logged, so the wording is neutral. The old
"step goal nudge" was removed: a scheduled notification can't check how close
you are to the goal.

## Your data

Signed-in accounts get Settings → _Your data_: **Export my data** shares a JSON
copy (weights in pounds) through the system share sheet, and **Delete my data**
erases every `tern.*` row for the account and signs you out, keeping the login.
**Delete my account** removes the login too, through the `tern.delete_my_account()`
function (`20260922000000_delete_account.sql`; run it in the SQL Editor). The public
instructions Google Play asks for are at `docs/delete-account.html`.

## Step goal

Changing the step goal applies from that day on (`stepGoalHistory` in your
settings). Past days keep the goal they were judged against, so raising the
goal never breaks an existing streak. With "Suggest adjustments" on, Settings →
Step goal may offer a gentler or slightly higher goal based on the last 30 days;
it is only ever a suggestion.

## Releasing

- **App identity:** `com.purlieus.tern` in `app.json` (Android `package`, iOS
  `bundleIdentifier`) is a placeholder. Pick your real id before the first store
  build; it can't be changed afterwards.
- **Icon and splash:** generated from the Tern mark into `assets/` (icon,
  adaptive icon, splash, notification icon). Replace them if you have final art.
- **Builds:** `eas.json` has `development`, `preview` (installable APK) and
  `production` profiles. The Supabase URL and anon key come from `.env` locally;
  for EAS builds add them as EAS environment variables
  (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_USDA_API_KEY` for everyday-food search), since `.env` is not committed.
- **Privacy policy:** [docs/index.html](../docs/index.html) is a draft. Host it at
  a public URL; Google Play and Health Connect both ask for one.
- **Native folders:** `android/` and `ios/` are generated by `expo prebuild` and
  are gitignored.

## Not built yet

- Distance and weight-from-scale from Health Connect.
- iOS (HealthKit) steps.
