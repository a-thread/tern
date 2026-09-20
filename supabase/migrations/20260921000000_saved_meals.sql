-- Saved meals: a named group of foods (with the portions eaten) that can be
-- added to a meal in one step. The items are a snapshot stored as jsonb, so a
-- saved meal is independent of the log entries it was made from.

create table tern.saved_meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  items      jsonb not null check (
    jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One meal per name (ignoring case and surrounding spaces).
create unique index saved_meals_user_name_idx
  on tern.saved_meals (user_id, lower(btrim(name)));

alter table tern.saved_meals enable row level security;

create policy "own saved meals" on tern.saved_meals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on tern.saved_meals to authenticated;
