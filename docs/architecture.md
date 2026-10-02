# Architecture

One folder per domain, and every domain has the same shape. The layout is a rule, not a
habit: a file belongs in the folder for its kind, and code that passes CI but breaks the
layout is still a review comment.

## Feature layout

```text
src/<feature>/
  <Feature>Context.tsx       the Feature Store: state, actions, derived values
  <Feature>Context.test.tsx
  models/                    the domain: types, constants and the pure rules about them
    <concept>.ts                   one concept per file (waterEntry.ts, waterBars.ts…)
    <feature>.test.ts              tests for the feature's models
  navigation.ts              the feature's stack param list, if it has a stack
  utils/                     generic pure helpers that are not about one domain concept
  data/                      every touch of the outside world, and nothing else
    <name>.repository.ts           interface + in-memory implementation
    <name>.repository.supabase.ts  Supabase implementation
    <name>.mock.ts                 seed data for the preview and tests
    sources/                       third-party read APIs (food: usda, openFoodFacts)
  hooks/                     feature-local hooks
  components/                feature-local UI, one component per file
  screens/                   *Screen.tsx and *Stack.tsx
```

| Layer     | Lives in                              | Rule                                                                                                                    |
| --------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Data      | `data/`                               | I/O only. No React, no state. Hidden behind a repository interface; the memory implementation is what tests use.        |
| Rules     | `models/`, `utils/`                   | Pure functions, types and constants. Never imports React or `data/`, so it is testable without rendering.               |
| State     | `*Context.tsx`                        | Composes `data/` and `utils/`. Owns the actions. Exposes what the UI reads; screens never touch a repository.           |
| UI        | `screens/`, `components/`, `hooks/`   | Reads the context and wires the view. No business rules — if it needs one, it belongs in `models/` or `utils/`.         |

The rules:

1. **`data/` is mandatory for anything with I/O.** Repositories, mocks, device adapters
   (`steps.healthconnect.ts`), notification scheduling (`reminders.ts`) and third-party
   APIs all live there. Outside `data/` (and `shared/backend`, `shared/auth`), nothing
   touches `supabase-js`, `fetch`, notifications, Health Connect or AsyncStorage.
2. **Repository naming** is `<resource>.repository.ts`, `<resource>.repository.supabase.ts`
   and `<resource>.mock.ts`, where the resource is what the interface is named for
   (`waypoints`, `savedMeals`, `restDays`). A feature may have several resources.
3. **`models/` is a folder, one concept per file.** No single `models.ts` that keeps growing:
   split by what the code is about (`dayRecord.ts`, `stepGoal.ts`, `leftToDo.ts`). A model
   file imports other model files, never React, a context or `data/`. `utils/` is only for
   helpers that aren't about one domain concept (comparing two lists, picking a colour).
   Tests sit beside what they test; a feature's `<feature>.test.ts` covers its model files.
4. **Constants are grouped in classes.** Fixed values live as `static readonly` members of a
   class named for what they describe — `WaterLimits.MAX_DRINK_OZ`, `StepGoal.MIN`,
   `Meals.CORE` — in the model file they belong to, not as loose `UPPER_CASE` exports.
   One class per group, no instances, no methods; the rules about them stay functions.
   A lone constant that nothing else relates to can stay a plain `const`.
5. **Props are for shared components.** Components inside a feature read the context
   directly rather than drilling props. `shared/components` take props.
6. **Provider scope.** Mount a context at the root (`AppProviders`) only if it is
   genuinely app-wide. State owned by one flow is provided at that flow's navigator.
7. **Screens of one navigator share a subfolder** (`food/screens/logging/` holds
   `LogFoodStack` and its screens) once a feature has more than one navigator. A feature
   with a single stack keeps `screens/` flat.
8. **No generic names.** No `types.ts`, `components.tsx`, `helpers.ts`, and no `index.ts`
   barrels inside a feature. Name the file for what it holds.
9. **Imports.** `./x` inside the same folder; the `@feature/...` alias for anything else.
   No `../`.
10. **Promotion.** Code used by two or more features moves to `shared/` (`shared/models`,
   `shared/utils`, `shared/hooks`, `shared/components`). A feature never
   imports another feature's `data/` — go through its context or `models/`. Only the
   composition root (`shared/state/BackendContext`) and tests may.
11. **Only create a folder when it has a file.** A feature does not get an empty
    `components/` for symmetry. But once a file of that kind exists, it goes in the folder.
12. **Sub-features.** A flow big enough to have its own context and repository may become
    a nested feature with the same layout. Nothing needs that yet.

`shared/` is organised by kind (`auth`, `components`, `hooks`, `models`, `navigation`, `state`,
`theme`, `utils`) and follows the import rule above.

### Shared building blocks for contexts

Every context loads its data and saves edits the same way, so that part is shared rather
than rewritten:

- `useLoader(load, onLoaded, note)` — loads when its deps change, tracks `ready`, ignores
  results after unmount, and logs rather than throws.
- `usePersist(reload)` — the optimistic write: change the screen first, hand the repository
  write over, and on failure tell the person and reload.
- `createRequiredContext(hookName, providerName)` — the context and a hook that throws when
  used outside its provider.
- `useAward(source, earned, active)` (in `journey/hooks`) — keeps today's waypoint award in
  step with a condition: given when it becomes true, taken back when it stops.

## Where things are

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
    hooks/, models/, utils/  day keys, trend ranges, dates, units, ids, loading and saving helpers
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
