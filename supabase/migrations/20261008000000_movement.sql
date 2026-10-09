-- Movement logged by hand: an activity, minutes and an optional effort, on the
-- person's local day. No calories: energy out shows up in the adaptive target,
-- never as a per-workout estimate. Health Connect workouts are read on the
-- phone and not stored here.

create table tern.movement_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  activity   text not null check (activity in ('walk', 'run', 'bike', 'swim', 'strength', 'yoga', 'class', 'other')),
  minutes    integer not null check (minutes between 1 and 600),
  effort     text check (effort in ('easy', 'moderate', 'hard')),
  logged_at  timestamptz not null default now()
);

create index movement_entries_user_day_idx on tern.movement_entries (user_id, day desc);

alter table tern.movement_entries enable row level security;

create policy "own movement" on tern.movement_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on tern.movement_entries to authenticated;

-- Movement can be logged for today or yesterday. `day` is the local day, and
-- every time zone is within a day of UTC, so yesterday is at most two UTC days
-- back (require_recent_day allows one, for things that are today only).
create or replace function tern.require_today_or_yesterday()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.day < (now() at time zone 'utc')::date - 2
     or new.day > (now() at time zone 'utc')::date + 1 then
    raise exception 'Only today or yesterday can be recorded (got %)', new.day;
  end if;
  return new;
end;
$$;

create trigger movement_entries_recent_day
  before insert or update on tern.movement_entries
  for each row execute function tern.require_today_or_yesterday();

-- Logging movement earns a waypoint, like the other behaviors. The steps rule
-- now reads as "a goal day": reached by steps or by enough movement.
-- The sources and fixed points are the ones in `WaypointRules` and
-- `StreakBonuses` (src/journey/models/waypoint.ts); keep the two in step.

alter table tern.waypoint_events drop constraint if exists waypoint_events_source_check;
alter table tern.waypoint_events
  add constraint waypoint_events_source_check
  check (source in (
    'steps', 'meals', 'rest', 'water', 'mood',
    'weight', 'medication', 'breakfast', 'lunch', 'dinner', 'streak', 'movement'
  ));

alter table tern.waypoint_events drop constraint if exists waypoint_events_points_check;
alter table tern.waypoint_events
  add constraint waypoint_events_points_check check (
    (source = 'steps' and points = 40)
    or (source = 'meals' and points = 15)
    or (source in ('rest', 'water', 'mood', 'medication', 'movement') and points = 10)
    or (source in ('weight', 'breakfast', 'lunch', 'dinner') and points = 5)
    or (source = 'streak' and points in (25, 40, 75, 100, 150, 250, 500))
  );
