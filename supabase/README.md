# Tern backend

Tern stores its data in Supabase, in a dedicated `tern` schema, so it can share
a project (and its login) with other apps without touching their `public`
tables. With no keys configured, the app runs on local mock data instead.

## Setup

1. **Run the migration.** In the Supabase dashboard open *SQL Editor* and run
   [`migrations/20260918000000_tern_schema.sql`](migrations/20260918000000_tern_schema.sql)
   (or `supabase db push` if you use the CLI). Then run
   [`migrations/20260919000000_weight_in_pounds.sql`](migrations/20260919000000_weight_in_pounds.sql),
   which switches weight storage from kg to lb, and
   [`migrations/20260920000000_rest_days.sql`](migrations/20260920000000_rest_days.sql),
   which adds the rest-days table.
2. **Expose the schema.** *Project Settings → API → Exposed schemas* → add `tern`.
   Without this, every request fails with "schema must be one of…".
3. **Add keys.** Copy `.env.example` to `.env` and fill in the project URL and
   the `anon` key (*Project Settings → API*). The anon key is safe to ship in
   the app; row-level security is what protects the data. Never put the
   `service_role` key in `.env`.
4. **Email confirmation.** If the project has *Confirm email* on, new accounts
   must confirm before signing in (the sign-up screen says so). Turn it off
   under *Authentication → Providers → Email* while developing if you like.
5. **Allow the app's email links.** Confirmation and password-reset emails open
   the app through a deep link. Under *Authentication → URL Configuration →
   Redirect URLs* add `tern://**` (a built app) and `exp://**` (Expo Go
   during development). These are additive, so other apps sharing the project
   (e.g. Lichen's web URL) are unaffected. Without them the links fall back to
   the project's Site URL instead of opening Tern.
6. Restart Expo with `npx expo start --clear` so the new env vars are picked up.

## What's stored

| Table | Contents |
| --- | --- |
| `tern.settings` | one row per user; the whole settings object as `jsonb` |
| `tern.food_entries` | each logged food, by day and meal |
| `tern.weight_entries` | each weigh-in, in pounds (kg is a display setting) |
| `tern.waypoint_events` | the waypoints ledger: one row per award |
| `tern.rest_days` | the days you chose to rest (one row per day) |

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
The adapter is [src/today/steps.healthconnect.ts](../src/today/steps.healthconnect.ts);
**it has not been run on a device.** To turn it on:

1. `npx expo install react-native-health-connect expo-build-properties`
2. Add the config plugins to `app.json` (`react-native-health-connect`, and
   `expo-build-properties` with `android.minSdkVersion: 26`), plus the
   `android.permission.health.READ_STEPS` permission.
3. `npx expo prebuild` then `npx expo run:android` (or an EAS development build).
4. In the app: Settings → Health data → *Connect Health Connect*.

Follow the library's Expo setup guide for the exact plugin options for your
version, and check the `aggregateGroupByPeriod` call against it on a device.

## Rest days and the streak

You choose rest days from Today ("Take today as a rest day"), within the weekly
allowance in Settings → Rest days. With auto-detect on, a *past* day that has
some steps but is well under the goal also reads as a rest day (within the same
allowance, chosen days first). Days with no step data are never treated as rest
days. A rest day holds the streak without adding to it. Taking one earns the
rest waypoints; undoing it takes them back quietly.

## Not built yet

- Reminders don't send anything yet (the toggles in Settings only save a preference).
- Distance, weight-from-scale and the Health Connect write toggles are placeholders.
- Export / delete my data.
- Trends for food history (the calories card shows today only).
