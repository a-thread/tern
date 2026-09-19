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

```
App.tsx                    fonts + bottom tab navigation
src/
  theme/index.ts           all design tokens, the palette rule, gradient sets
  components/
    TernMark.tsx           the logo as a tintable SVG path
    ui.tsx                 Group, Row, Chip, TierDot, MacroBar, Toggle, Insight
    charts.tsx             FlightPath, StepBars, WeightTrend, ConsistencyGrid, DayRing
  screens/
    TodayScreen.tsx        hero + week rings + flight plan + macros
    FoodScreen.tsx         meals, tier dots, totals
    TrendsScreen.tsx       steps + weight merged, range switcher
    JourneyScreen.tsx      waypoints, milestones, earning rules
  data/mock.ts             all mock data — shaped like the eventual DB tables
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

## Next: wiring the backend

Everything currently reads from `src/data/mock.ts`. The shapes there match the intended
tables, so this is mostly a swap.

### Supabase schema sketch

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  step_goal int default 8000,
  calorie_target int,
  macro_targets jsonb,
  weight_goal_kg numeric,
  units text default 'metric',
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
  kg numeric not null
);

create table waypoint_events (     -- append-only ledger
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  date date not null,
  rule text not null,              -- 'steps' | 'meals' | 'rest'
  points int not null
);
```

Enable RLS on every table with the standard `auth.uid() = user_id` policy.

Keep `waypoint_events` append-only — never recompute or claw back earned points. That's
what makes the "nothing you've earned is taken back" promise true at the data layer.

### Health data

Steps currently come from mock data. For real device steps use
[`@capgo/capacitor-health`'s RN equivalent] — in Expo terms, either:

- `react-native-health` (iOS HealthKit) + `react-native-health-connect` (Android), or
- a config plugin wrapping both.

Either way you'll need to leave Expo Go and build a **dev client**
(`npx expo prebuild` + `npx expo run:ios`). Health Connect also requires declaring each
permission in `AndroidManifest.xml`, and Google Play reviews every declared health
permission — declare only what you actually read.

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

- Logging flows (food search, barcode scan, food detail, manual entry, weight entry)
- Settings screens
- Onboarding / day-one empty states
- Reward modal on goal completion
- Auth
