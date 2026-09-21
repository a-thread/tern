-- Water tracking. Each drink is a row, stored in US fluid ounces (millilitres
-- are a display choice, like kilograms for weight). `logged_on` is the
-- person's local day, chosen by the app, so "today" never shifts with the time zone.

create table tern.water_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  oz         numeric(6, 2) not null check (oz >= 0.1 and oz <= 170),
  logged_on  date not null,
  logged_at  timestamptz not null default now()
);

create index water_entries_user_day_idx on tern.water_entries (user_id, logged_on desc);

alter table tern.water_entries enable row level security;

create policy "own water entries" on tern.water_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on tern.water_entries to authenticated;

-- Reaching the daily water goal earns a waypoint, like the other behaviors.
-- (Still behavior only: nothing here can be written from a weight or calorie figure.)
alter table tern.waypoint_events drop constraint if exists waypoint_events_source_check;
alter table tern.waypoint_events
  add constraint waypoint_events_source_check
  check (source in ('steps', 'meals', 'rest', 'water'));
