# Tern

A personal health tracker built around the Arctic tern's migration — steps, food, weight,
and a long-horizon reward system that pays out for **showing up**, never for weight or
calorie totals.

## Running it

```bash
npm install
npx expo start
```

Then scan the QR code with Expo Go (iOS/Android), or press `i` / `a` for a simulator.

> Note: `react-native-svg` and `expo-linear-gradient` are native modules, but both ship
> inside Expo Go, so no custom dev client is needed yet. You'll need one once you add
> the health plugin (below).

## Structure

One folder per domain. Within a folder: `models.ts` for the pure rules (with
`models.test.ts` beside it), a `*Context.tsx` holding the state, `repository.ts` and
`repository.supabase.ts` for storage, and the screens.

```
App.tsx                    fonts, providers, navigation
src/
  shared/
    theme/index.ts         all design tokens, the palette rule, gradient sets
    components/ui/         Group, Row, Chip, Toggle, SheetNav, FootNote…
    components/charts.tsx  FlightPath, StepBars, WeightTrend, ConsistencyGrid, DayRing
    components/TernMark.tsx  the logo as a tintable SVG path
    navigation/            root navigator and every param list
    state/                 BackendContext (memory or Supabase), providers, toasts
    auth/                  sign in, create account, password reset, AuthGate
    hooks/, utils/         day keys, dates, units, ids, replay-on-focus
  today/                   TodayScreen, steps, rest days, "left to do"
  food/                    the Food tab, the Add food stack, saved meals, search
  journey/                 waypoints ledger, the map, milestones, reward cards
  trends/                  steps, weight, water and mood over time
  weight/, water/, mood/, medication/
  settings/                every settings screen, the settings document, reminders
supabase/migrations/       the schema, in order
```

## The palette rule

`coral (#D8431F)` is the **primary action color only** — the way the bill is one small
bright mark on a mostly-white bird. Every other domain has its own hue:

| Domain                | Color                                 |
| --------------------- | ------------------------------------- |
| Steps, movement       | glacier `#5FA8B8`                     |
| Weight, trends        | deep water `#3E5A6C`                  |
| Journey, milestones   | aurora `#4E8C7D` + twilight `#6B5B9A` |
| Streaks, goal moments | midnight sun `#E0A32E`                |
| Whole foods           | kelp `#5C6B4E`                        |
| Rest days             | driftwood `#5B4636`                   |

If you find yourself reaching for coral to make something stand out, reach for the
domain color instead.

## Design commitments

These are deliberate and worth preserving as the app grows:

1. **Rewards are for behavior, never outcomes.** Waypoints come from logging, moving,
   and resting. Nothing pays out for a number on the scale or staying under a calorie
   target.
2. **No compensatory mechanics.** Exercise never "earns back" food. There is no
   equivalent of banking steps for a treat.
3. **Rest days are first-class.** They hold the streak (don't increment it), earn
   waypoints, and render in driftwood — visually distinct from a missed day.
4. **Weight is shown as a trend with a visible fluctuation band.** Day-to-day deltas are
   deliberately de-emphasized because they're mostly water.
5. **Food color is information, not judgment.** It maps to NOVA processing level, always
   shows the number alongside the color (accessibility), is user-overridable, and can be
   switched off entirely in settings.

## The backend

Supabase, reached through one repository per domain. Each has an in-memory
implementation — used in the preview, when there are no keys, and in every test — and a
Supabase one; `src/shared/state/BackendContext.tsx` chooses between them, and nothing
above that line knows which it got.

### Supabase schema sketch

`supabase/migrations/` is the schema of record. The sketch below is what it grew from,
and it has drifted: settings live in a single jsonb document rather than columns on
`profiles`, and there are tables it doesn't mention.

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

Past days in `waypoint_events` are never recomputed or clawed back. Today's awards follow
today as it stands (removing a meal, a drink or a check-in quietly takes that award back),
and once the day is over its awards are settled. The migrations add sanity checks: fixed
points per rule, and only today's date.

### Health data

Android steps come from Health Connect (`react-native-health-connect`), through
`src/today/steps.healthconnect.ts`. It is off unless `EXPO_PUBLIC_HEALTH_CONNECT=1`,
and has been verified by manual testing on a device. Without it (and in the preview,
and in tests) steps come from the in-memory repository.

It needs a custom dev build — Expo Go can't load native modules — so leave Expo Go and
build a **dev client** (`npx expo prebuild` + `npx expo run:android`). Health Connect
also requires declaring each permission in `AndroidManifest.xml`, and Google Play
reviews every declared health permission — declare only what you actually read. iOS
HealthKit (`react-native-health`) is not wired up yet.

Always keep the manual step-entry path working; permissions fail often enough that it
can't be the only route.

### Food search

Open Food Facts, free and keyless:

```
https://world.openfoodfacts.org/api/v2/search?categories_tags=...&fields=code,product_name,brands,nutriments,nova_group
https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

Cache every product you look up into the `foods` table — the project runs on donations
and asks that you avoid hammering the live API. Data is ODbL, so **credit Open Food
Facts in-app** (already present in the Food screen footer).

## Not built yet

- Onboarding, and the day-one empty states that go with it
- iOS HealthKit (`react-native-health`) — steps are Android-only for now
