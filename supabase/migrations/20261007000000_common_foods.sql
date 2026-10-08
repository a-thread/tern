-- Common foods: a shared, read-only list of everyday foods (built from USDA
-- FoodData Central, public domain) that the app caches and searches on the
-- phone. Written only by scripts/publishCommonFoods.ts with the service role;
-- signed-in users can read it.

create table tern.common_foods (
  id         text primary key,
  name       text not null check (char_length(btrim(name)) between 1 and 120),
  detail     text,
  aliases    text[] not null default '{}',
  kcal       numeric not null check (kcal between 0 and 950),
  protein    numeric not null default 0 check (protein >= 0),
  carbs      numeric not null default 0 check (carbs >= 0),
  fat        numeric not null default 0 check (fat >= 0),
  portions   jsonb not null default '[]' check (jsonb_typeof(portions) = 'array'),
  rank       integer not null check (rank > 0),
  tier       smallint check (tier between 1 and 4),
  updated_at timestamptz not null default now()
);

create index common_foods_rank_idx on tern.common_foods (rank);

-- One row: the version of the list, bumped on every publish so apps know to re-download.
create table tern.common_foods_meta (
  id         boolean primary key default true check (id),
  version    text not null,
  updated_at timestamptz not null default now()
);

alter table tern.common_foods enable row level security;
alter table tern.common_foods_meta enable row level security;

create policy "read common foods" on tern.common_foods for select to authenticated using (true);
create policy "read common foods version" on tern.common_foods_meta for select to authenticated using (true);

grant select on tern.common_foods to authenticated;
grant select on tern.common_foods_meta to authenticated;
