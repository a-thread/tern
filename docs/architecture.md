# Architecture

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

## Storage

Supabase, reached through one repository per domain. Each has an in-memory
implementation — used in the preview, when there are no keys, and in every test — and a
Supabase one; [`src/shared/state/BackendContext.tsx`](../src/shared/state/BackendContext.tsx)
chooses between them, and nothing above that line knows which it got.

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
