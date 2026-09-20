-- Days the user chose to rest. Rest days hold the streak and earn the 'rest'
-- waypoint (recorded separately in waypoint_events). One row per user per day.

create table tern.rest_days (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table tern.rest_days enable row level security;

create policy "own rest days" on tern.rest_days for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on tern.rest_days to authenticated;
