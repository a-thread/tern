-- Skipped meals: a core meal marked "nothing today". It counts toward the
-- "logging all meals" waypoint exactly like a logged meal, so the rule rewards
-- an honest, complete log and never eating (or skipping) for the points.
-- One row per user, day and meal; un-marking deletes the row.

create table tern.skipped_meals (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  meal       text not null check (meal in ('breakfast', 'lunch', 'dinner')),
  created_at timestamptz not null default now(),
  primary key (user_id, day, meal)
);

alter table tern.skipped_meals enable row level security;

create policy "own skipped meals" on tern.skipped_meals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on tern.skipped_meals to authenticated;

-- ------------------------------------------------------- ledger sanity checks
-- The app only ever awards the fixed points for a rule, and only for today.
-- These keep the ledger to that even if a request is made by hand. There's no
-- leaderboard, so this is about the journey staying honest, not about security.

alter table tern.waypoint_events
  add constraint waypoint_events_points_check check (
    (source = 'steps' and points = 40)
    or (source = 'meals' and points = 15)
    or (source in ('rest', 'water', 'mood') and points = 10)
  );

-- `day` is the person's local day. Every time zone is within a day of UTC, so
-- a genuine "today" is always between yesterday and tomorrow in UTC. A trigger
-- rather than a CHECK, because the window moves with the clock.
create or replace function tern.require_recent_day()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.day < (now() at time zone 'utc')::date - 1
     or new.day > (now() at time zone 'utc')::date + 1 then
    raise exception 'Only today can be recorded (got %)', new.day;
  end if;
  return new;
end;
$$;

create trigger waypoint_events_recent_day
  before insert or update on tern.waypoint_events
  for each row execute function tern.require_recent_day();

create trigger rest_days_recent_day
  before insert or update on tern.rest_days
  for each row execute function tern.require_recent_day();
