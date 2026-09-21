-- Mood and stress check-ins. One row per user per local day: mood and stress
-- each on a 1-10 scale. `day` is the person's local day, chosen by the app, so
-- "today" never shifts with the time zone. Checking in again the same day
-- replaces that day's row.

create table tern.mood_checkins (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day         date not null,
  mood        smallint not null check (mood between 1 and 10),
  stress      smallint not null check (stress between 1 and 10),
  updated_at  timestamptz not null default now(),
  primary key (user_id, day)
);

alter table tern.mood_checkins enable row level security;

create policy "own mood check-ins" on tern.mood_checkins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on tern.mood_checkins to authenticated;

-- Checking in earns a waypoint, like the other behaviors. It is for the act of
-- checking in, never for the numbers: nothing here reads mood or stress.
alter table tern.waypoint_events drop constraint if exists waypoint_events_source_check;
alter table tern.waypoint_events
  add constraint waypoint_events_source_check
  check (source in ('steps', 'meals', 'rest', 'water', 'mood'));
