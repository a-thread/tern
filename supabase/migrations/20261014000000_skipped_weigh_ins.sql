-- Skipped weigh-ins: a day marked "not weighing in". It only clears the weigh-in
-- from that day's "Left to do"; it earns no waypoint and never counts as a weigh-in.
-- One row per user and day; un-marking (or logging a weight) deletes the row.

create table tern.skipped_weigh_ins (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table tern.skipped_weigh_ins enable row level security;

create policy "own skipped weigh-ins" on tern.skipped_weigh_ins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on tern.skipped_weigh_ins to authenticated;
