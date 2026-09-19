-- Tern schema. Lives in its own `tern` schema so it can share a Supabase
-- project (and its auth.users) with other apps without touching `public`.
--
-- After running this, expose the schema to the API:
--   Dashboard -> Project Settings -> API -> Exposed schemas -> add `tern`.

create schema if not exists tern;

grant usage on schema tern to authenticated;

-- ---------------------------------------------------------------- settings
-- One row per user. The whole AppSettings object is stored as jsonb so new
-- toggles don't need a migration; the app merges it over its defaults.
create table tern.settings (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------ food_entries
create table tern.food_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_on       date not null,
  meal            text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  name            text not null check (char_length(name) between 1 and 200),
  brand           text,
  servings        numeric(6, 2) not null default 1 check (servings > 0),
  serving_label   text not null default '1 serving',
  calories        numeric(7, 1) not null default 0 check (calories >= 0),
  protein         numeric(6, 1) not null default 0 check (protein >= 0),
  carbs           numeric(6, 1) not null default 0 check (carbs >= 0),
  fat             numeric(6, 1) not null default 0 check (fat >= 0),
  -- NOVA-style tier: informational, and user-overridable (tier_overridden).
  tier            smallint not null default 1 check (tier between 1 and 4),
  tier_overridden boolean not null default false,
  created_at      timestamptz not null default now()
);

create index food_entries_user_day_idx on tern.food_entries (user_id, logged_on);

-- ---------------------------------------------------------- weight_entries
create table tern.weight_entries (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kg        numeric(5, 2) not null check (kg between 20 and 500),
  logged_at timestamptz not null default now()
);

create index weight_entries_user_time_idx on tern.weight_entries (user_id, logged_at desc);

-- --------------------------------------------------------- waypoint_events
-- The waypoints ledger. A user's total is the sum of their events.
--
-- Waypoints are earned for behavior only, so `source` is restricted to the
-- three behavior rules: reaching the step goal, logging every meal, and
-- taking a rest day. Nothing here can be written from a weight or calorie
-- figure. At most one award per source per day (unique constraint), which
-- makes awarding idempotent; taking one back deletes its row.
create table tern.waypoint_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source     text not null check (source in ('steps', 'meals', 'rest')),
  points     integer not null check (points > 0),
  day        date not null,
  created_at timestamptz not null default now(),
  unique (user_id, source, day)
);

create view tern.waypoint_totals
  with (security_invoker = true) as
  select user_id, coalesce(sum(points), 0)::integer as total
  from tern.waypoint_events
  group by user_id;

-- ------------------------------------------------------ row-level security
alter table tern.settings        enable row level security;
alter table tern.food_entries    enable row level security;
alter table tern.weight_entries  enable row level security;
alter table tern.waypoint_events enable row level security;

create policy "own settings"   on tern.settings        for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own food"       on tern.food_entries    for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own weight"     on tern.weight_entries  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own waypoints"  on tern.waypoint_events for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Signed-in users only; the anon role gets nothing.
grant select, insert, update, delete on all tables in schema tern to authenticated;
alter default privileges in schema tern
  grant select, insert, update, delete on tables to authenticated;
