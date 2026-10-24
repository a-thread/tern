# Architecture

Code is organised by screen, not by kind. A file lives next to the screen (or the single
component) that uses it, and only moves up when something else needs it. The rules are in
[CLAUDE.md](../CLAUDE.md); this page explains the shape and why.

## Layout

```text
src/
  AppProviders.tsx  AuthGate.tsx  BackendContext.tsx  providerOrder.ts   the composition root
  navigation/              RootNavigator, the route registry (types.ts), typed navigation hooks
  today/                   the Today tab: TodayScreen, rest-day/, components/, hooks/, models/
  food/                    the Food tab, log-food/ (the Add food stack), edit-food/, save-meal/
  trends/                  Trends, steps-detail/, weight-detail/, and the trend cards
  journey/                 the map, waypoints/, milestone/
  settings/                SettingsStack, the index, and one folder per page (water/, mood/, targets/…)
  auth/                    sign in, create account, forgot and reset password
  movement/  check-in/  log-weight/   modal flows
  domain/<name>/           what several tabs share: a Context, its repository, models
  shared/                  used by more than one tab, generic or not: components/, hooks/, models/, state/, theme/, utils/
```

Inside a screen the same shape repeats: `<Name>Screen.tsx`, then `components/<Name>/<Name>.tsx`
(one folder per component, test beside it), `hooks/`, `models/`, `utils/`. A component's private
pieces nest in its own folder — `search/components/FoodGroup/components/FoodResultRow/` is only
used by `FoodGroup`, so it lives inside it. Something used by two sibling components sits in
their common parent's `components/`; something used from two tabs moves to `domain/` or `shared/`.

## Layers

| Layer | Lives in                         | Rule                                                                                |
| ----- | -------------------------------- | ----------------------------------------------------------------------------------- |
| Data  | `domain/<name>/*.repository*.ts` | I/O only. No React, no state. Behind an interface; the memory version is for tests. |
| Rules | `models/`, `utils/`              | Pure functions, types, constants. Never import React, a Context or a repository.    |
| State | `domain/<name>/*Context.tsx`     | Composes a repository, owns the actions, exposes what the UI reads.                 |
| UI    | screens, `components/`, `hooks/` | Reads the Context, wires the view. No business rules.                               |

Dependencies point down: `domain` → `shared` → screens → `app`. `shared/` may read `domain/` (`IntakeBars` and `WaterCard` do); `domain/` never imports `shared/components`. A screen never imports another
tab's folder. If two tabs need something it moves to `domain/` (data and rules) or `shared/`
(UI or plumbing), which means "used by more than one component or util", not "might be reused".

### Domain

`domain/` holds one folder per kind of data, each with the same parts: `<Name>Context.tsx`,
`<name>.repository.ts` (interface plus in-memory version), `<name>.repository.supabase.ts`,
sometimes `<name>.mock.ts`, and its `models/`. The domains are `food`, `saved-meals`,
`common-foods`, `weight`, `water`, `mood`, `meal-check-ins`, `medication`, `movement`, `activity` (steps and rest
days), `waypoints`, `settings`, `auth` and `health` (the HealthKit wrapper both step and workout adapters use). Third-party read APIs (USDA, Open Food Facts) sit in
`domain/food/sources/`.

`settings` sits below the other domains: it owns the types and limits of its own fields (`Aim`, `CalorieZone`,
`StepGoal`, `MovementGoal`, `WaterGoal`, `Medication`) and imports from no feature domain, while food, activity,
movement, water and medication read `SettingsContext` and import those types from it. `saved-meals` likewise owns
`mealDraft`, so `food` no longer imports it back.

Only `BackendContext` builds repositories. `AppProviders` hands each to its provider as a
`repo` prop, so nothing below `app/` knows whether it got Supabase or the in-memory version, and a
screen that wants history asks its Context (`loadHistory`, `loadRange`).

`AppProviders` lists every provider and the ones it needs; the order is checked at start-up
(`assertProviderOrder`), so a provider placed too high fails loudly. State that belongs to one
flow is provided at that flow's navigator instead of at the root.

### Settings

Each settings page is a sub-screen of `settings/` with its own folder (`settings/water/`,
`settings/mood/`…). Rows several pages share (`ReminderBlock`, `TimeStepperRow`, the reminder
rows) are in `settings/components/`, and the one-line summaries on the index are in
`settings/models/`.

### Closed sets are enums

A value from a fixed set that is compared or switched on is an enum, not a string union:
`DayState`, `Meal`, `WaypointSource`, `MoodMetric`, `Frequency`, `Units`, `StepsStatus`,
`TrendRange`. Values are the same strings that are stored, so saved data does not change.
Compare with the member (`day.state === DayState.Rest`), never a literal. Fixed numbers are
grouped as `static readonly` members of a class (`WaterLimits.MAX_DRINK_OZ`).

### Shared building blocks for contexts

Every context loads its data and saves edits the same way, so that part is shared:

- `useLoader(load, onLoaded, note)` — loads when its deps change, tracks `ready`, ignores
  results after unmount, and logs rather than throws.
- `usePersist(reload)` — the optimistic write: change the screen first, hand the repository
  write over, and on failure tell the person and reload.
- `useSyncedList(load, note)` — `useLoader` and `usePersist` together for a list, with a
  `change(update, write, failure)` that edits the list and persists in one call.
- `createRequiredContext(hookName, providerName)` — the context and a hook that throws when
  used outside its provider.
- `useAward(source, earned, active)` (in `domain/waypoints/hooks`) — keeps today's waypoint
  award in step with a condition.
- `ok(query)` and `rows<T>(query)` (`shared/backend/query`) — what every Supabase repository
  uses instead of repeating the `if (error) throw error` check.

## Storage

One repository per domain, in three versions: Supabase for a signed-in account, SQLite on
the phone for everyone else, and in memory for development without keys and for every
test. [`src/BackendContext.tsx`](../src/BackendContext.tsx) builds each set and
[`src/AuthGate.tsx`](../src/AuthGate.tsx) picks one: signed in gets Supabase, otherwise the
phone's database (signing in is offered from Settings, never required). `AppProviders`
passes each repository to its provider, so nothing else knows which it got.

On the phone, common foods are the bundled seed, since the shared table needs a sign-in,
and "Delete my data" or a restore remounts every provider so nothing shows stale data.
`<name>.repository.local.ts` takes a `LocalDb`
([`shared/backend/localDb.ts`](../src/shared/backend/localDb.ts)), the schema is
[`localSchema.ts`](../src/shared/backend/localSchema.ts) (append-only, like the Supabase
migrations), and tests run the same cases against the memory and local versions using
sql.js, so no native module is needed.

The phone's data is protected two ways. `tern.db` lives in the app's files, which Android
Auto Backup copies to the person's Google account (`android.allowBackup` is set explicitly
in `app.json` so it isn't switched off by accident; Auto Backup holds up to 25 MB per app)
and iCloud backs up on iPhone. And Settings › Your data exports a `.json` file that
"Restore from a file" adds back. A restore merges: rows already here win, and rows that
don't fit their table are skipped. On the phone the file's settings replace the saved
ones; an account keeps its own. An account restores through the `import_my_data`
function, since its tables otherwise only accept today's waypoints, rest days and
movement.

## Tern Plus

Everything in Tern is free; Tern Plus is the account, which syncs and backs up. Making an
account goes through the paywall (`auth/paywall/`); signing in to an existing one doesn't.
The store is the source of truth: [`SubscriptionContext`](../src/domain/subscription/SubscriptionContext.tsx)
reads the `plus` entitlement from RevenueCat ([`subscription.revenuecat.ts`](../src/domain/subscription/subscription.revenuecat.ts),
behind a small `PurchasesApi` so it tests without the native module), and nothing about it
is stored in Supabase. It's mounted in `AuthGate` above the sign-in screens, since buying
comes before the account, and `identify` ties an anonymous purchase to the account once
they sign in. Without a RevenueCat key the memory version stands in and buying is free. The
`preview` build sets `EXPO_PUBLIC_PLUS_UNLOCKED`, which turns Plus on with nothing bought,
for testers who install the APK directly (see [RELEASING.md](RELEASING.md)).

Where the log lives follows Plus, decided in `AuthGate` with the moves in
[`accountMoves.ts`](../src/accountMoves.ts):

- **Signed in with Plus:** the account. Anything on the phone is uploaded into it first
  (`import_my_data`, merging), then the phone's copy is cleared. A failed upload clears
  nothing and is tried again on the next launch.
- **Signed in, Plus ended:** the phone. The account's log is copied down once per account
  (a `meta` row remembers it, so a second launch doesn't bring back what was since removed),
  and the app carries on from the phone. "Delete my data" reaches both copies. Renewing
  uploads everything back.
- **Store unreachable:** the account, with nothing moved. A status is only acted on once
  the store has answered for this account (`checkedFor`), not the phone's from before.
- A log copied down from one account is never uploaded into another (a shared phone).

When the store says no for a signed-in account, the app asks the server too
(`serverGrant` on `SubscriptionProvider`), so an account granted Plus by hand in
`tern.entitlements` (testers, grandfathered accounts) counts as having it, and the store's
"no" doesn't take it away mid-session. It's lapsed only when both say no; if the server
can't be reached, the status is unknown and nothing is moved.

The server enforces it too. `tern.entitlements` records who has Plus, written only by the
`plus` Edge Function ([`supabase/functions/plus/`](../supabase/functions/plus/)) or by hand.
Every table of the log can be read and deleted by its owner, but only added to or changed
while `tern.has_plus()` is true (with a day's slack past the expiry, for a renewal that
reaches the server late). So a lapsed account can still be copied down, exported and
erased. The function asks RevenueCat for the current state on every call rather than
trusting the event, and is called two ways: by RevenueCat's webhook, and by the app
(`Backend.syncPlus`) each time an account with Plus opens, before anything is moved in,
since RevenueCat doesn't always send an event when a purchase made before sign-up is tied
to the new account. Its logic is in `entitlement.ts`, tested with the app; `index.ts` is
the Deno wrapper, left out of typecheck and lint.

Setting a project up, and what each table holds, is in
[supabase/README.md](../supabase/README.md). `supabase/migrations/` is the schema of
record.

## The waypoints ledger

Past days in `waypoint_events` are never recomputed or clawed back. Today's awards
follow today as it stands (removing a meal, a drink or a check-in quietly takes that
award back), and once the day is over its awards are settled. The migrations add sanity
checks: fixed points per source, and only the current day.

## Schema sketch

The original sketch, kept because it shows the shape the app was designed around. It has
drifted — settings live in a single jsonb document rather than columns on `profiles`,
there is no `foods` cache table, and there are tables here it doesn't mention. Read the
migrations for what actually exists.

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  step_goal int default 8000,
  calorie_target int,
  macro_targets jsonb,
  weight_goal_lb numeric,
  units text default 'imperial',
  show_tiers bool default true,
  show_calories bool default true
);

create table step_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  date date not null,
  steps int not null,
  is_rest_day bool default false,
  unique (user_id, date)
);

create table foods (              -- cached Open Food Facts + user-created
  id uuid primary key default gen_random_uuid(),
  barcode text,
  name text not null,
  brand text,
  serving_label text,
  calories numeric, protein numeric, carbs numeric, fat numeric,
  nova_group int,                 -- 1–4, drives the default tier
  created_by uuid references profiles
);

create table food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  food_id uuid references foods,
  date date not null,
  meal text not null,
  servings numeric default 1,
  tier_override int                -- user's choice wins over nova_group
);

create table weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  logged_at timestamptz not null,
  lb numeric not null
);

create table waypoint_events (     -- append-only ledger
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  date date not null,
  rule text not null,              -- 'steps' | 'meals' | 'rest' | 'water' | 'mood'
  points int not null
);
```

Enable RLS on every table with the standard `auth.uid() = user_id` policy.
