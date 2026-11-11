-- Ternaries: small, invite-only circles of friends who fly one shared bird together.
-- See docs/ternaries.md for the design and what must never happen.
-- Changed since by 20261112000000_ternary_fixes.sql; read that one for the current functions.
--
-- Nothing here is readable or writable directly: every table has row-level security on and
-- no policies, and the app reaches them only through the security-definer functions below.
-- That's how a friend's showing up can be counted (waypoint_events is readable only by its
-- owner) without anyone ever seeing another person's log. What a friend sees is decided in
-- `ternary_state` alone:
-- - whether you showed up today (any waypoint but the arrival bonus), unless you fly privately;
-- - "resting" instead, only if you share that;
-- - fish brought to you, postcards and dishes, by display name.
-- No totals, streaks, stops, amounts or calories ever leave a member's own rows.
--
-- Every member needs Tern Plus. A member whose Plus has ended drops out of the count and the
-- flock quietly, and comes back when it's renewed; nobody is told why.

create table tern.ternaries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

create table tern.ternary_members (
  ternary_id    uuid not null references tern.ternaries (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 40),
  fly_privately boolean not null default false,
  share_resting boolean not null default false,
  joined_at     timestamptz not null default now(),
  primary key (ternary_id, user_id),
  -- One ternary each while ternaries are in beta.
  unique (user_id)
);

-- A day settled for the shared bird: written once and never recomputed. No user ids, so the
-- bird never jumps back when someone leaves.
create table tern.ternary_days (
  ternary_id uuid not null references tern.ternaries (id) on delete cascade,
  day        date not null,
  showed_up  integer not null check (showed_up >= 0),
  members    integer not null check (members >= 0),
  points     integer not null check (points between 0 and 75),
  primary key (ternary_id, day)
);

create table tern.ternary_fish (
  id         uuid primary key default gen_random_uuid(),
  ternary_id uuid not null references tern.ternaries (id) on delete cascade,
  from_user  uuid not null references auth.users (id) on delete cascade,
  to_user    uuid not null references auth.users (id) on delete cascade,
  day        date not null,
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create index ternary_fish_to on tern.ternary_fish (to_user, day);

-- `stop_id` is a route stop's id, without its lap; a postcard is one moment, sent once per
-- stop, so a later lap doesn't send the same place again.
create table tern.ternary_postcards (
  id         uuid primary key default gen_random_uuid(),
  ternary_id uuid not null references tern.ternaries (id) on delete cascade,
  from_user  uuid not null references auth.users (id) on delete cascade,
  stop_id    text not null check (char_length(stop_id) between 1 and 80),
  day        date not null,
  created_at timestamptz not null default now(),
  unique (ternary_id, from_user, stop_id)
);

-- A dish at a stopover table: a saved meal's name and its foods, never amounts or numbers.
-- `stop` is the lap and stop the shared bird rests at ("2-iceland"). One dish each per table.
create table tern.ternary_dishes (
  id         uuid primary key default gen_random_uuid(),
  ternary_id uuid not null references tern.ternaries (id) on delete cascade,
  from_user  uuid not null references auth.users (id) on delete cascade,
  stop       text not null check (char_length(stop) between 1 and 80),
  name       text not null check (char_length(name) between 1 and 60),
  foods      text[] not null check (cardinality(foods) between 1 and 50),
  created_at timestamptz not null default now(),
  unique (ternary_id, from_user, stop)
);

-- Blocking is silent: each stops seeing the other, and nobody is told.
create table tern.ternary_blocks (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null references auth.users (id) on delete cascade,
  primary key (blocker, blocked)
);

-- Reports go to the inbox by hand for now: read them in the SQL editor.
create table tern.ternary_reports (
  id         uuid primary key default gen_random_uuid(),
  reporter   uuid not null references auth.users (id) on delete cascade,
  ternary_id uuid references tern.ternaries (id) on delete set null,
  kind       text not null check (kind in ('dish', 'member')),
  target     text not null check (char_length(target) between 1 and 80),
  created_at timestamptz not null default now()
);

alter table tern.ternaries enable row level security;
alter table tern.ternary_members enable row level security;
alter table tern.ternary_days enable row level security;
alter table tern.ternary_fish enable row level security;
alter table tern.ternary_postcards enable row level security;
alter table tern.ternary_dishes enable row level security;
alter table tern.ternary_blocks enable row level security;
alter table tern.ternary_reports enable row level security;

-- The arrival bonus: 25 waypoints on your own journey when the shared bird reaches a stop.
-- The sources and fixed points are the ones in `WaypointRules` and `StreakBonuses`
-- (src/domain/waypoints/models/waypoint.ts); keep the two in step.
alter table tern.waypoint_events drop constraint if exists waypoint_events_source_check;
alter table tern.waypoint_events
  add constraint waypoint_events_source_check
  check (source in (
    'steps', 'meals', 'rest', 'water', 'mood',
    'weight', 'medication', 'breakfast', 'lunch', 'dinner', 'streak', 'movement',
    'arrival'
  ));

alter table tern.waypoint_events drop constraint if exists waypoint_events_points_check;
alter table tern.waypoint_events
  add constraint waypoint_events_points_check check (
    (source = 'steps' and points = 40)
    or (source = 'meals' and points = 15)
    or (source in ('rest', 'water', 'mood', 'medication', 'movement') and points = 10)
    or (source in ('weight', 'breakfast', 'lunch', 'dinner') and points = 5)
    or (source = 'streak' and points in (25, 40, 75, 100, 150, 250, 500))
    or (source = 'arrival' and points = 25)
  );

-- ------------------------------------------------------------ helpers (not callable by the app)

-- Whether someone has Plus now, by the same rule as `tern.has_plus()`.
create or replace function tern.user_has_plus(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from tern.entitlements e
    where e.user_id = p_user
      and (e.plus_expires_at is null or e.plus_expires_at > now() - interval '1 day')
  );
$$;

-- Showing up on a day: any waypoint but the arrival bonus, which nobody earns by doing anything.
create or replace function tern.showed_up(p_user uuid, p_day date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from tern.waypoint_events w
    where w.user_id = p_user and w.day = p_day and w.source <> 'arrival'
  );
$$;

-- The shared bird's step for a day: 75 × the share of members (with Plus) who showed up.
create or replace function tern.ternary_day_points(p_ternary uuid, p_day date)
returns table (showed_up integer, members integer, points integer)
language sql
stable
security definer
set search_path = ''
as $$
  with counted as (
    select
      count(*)::integer as members,
      count(*) filter (where tern.showed_up(m.user_id, p_day))::integer as showed_up
    from tern.ternary_members m
    where m.ternary_id = p_ternary and tern.user_has_plus(m.user_id)
  )
  select
    c.showed_up,
    c.members,
    case when c.members = 0 then 0 else round(75.0 * c.showed_up / c.members)::integer end
  from counted c;
$$;

revoke all on function tern.user_has_plus(uuid) from public, anon, authenticated;
revoke all on function tern.showed_up(uuid, date) from public, anon, authenticated;
revoke all on function tern.ternary_day_points(uuid, date) from public, anon, authenticated;

-- The caller's ternary, or null.
create or replace function tern.my_ternary()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.ternary_id from tern.ternary_members m where m.user_id = auth.uid();
$$;
revoke all on function tern.my_ternary() from public, anon, authenticated;

-- ------------------------------------------------------------ settling days

-- Writes every finished day not yet settled, for every ternary. A day is finished two days
-- after it in UTC, once it's over in every time zone. Run daily by pg_cron (below); until a
-- day is settled, `ternary_state` counts it live the same way.
create or replace function tern.settle_ternary_days()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  t record;
  d date;
  last_settled date;
  r record;
begin
  for t in select id, created_at from tern.ternaries loop
    select max(day) into last_settled from tern.ternary_days where ternary_id = t.id;
    d := coalesce(last_settled + 1, (t.created_at at time zone 'utc')::date);
    while d <= (now() at time zone 'utc')::date - 2 loop
      select * into r from tern.ternary_day_points(t.id, d);
      insert into tern.ternary_days (ternary_id, day, showed_up, members, points)
      values (t.id, d, r.showed_up, r.members, r.points)
      on conflict do nothing;
      d := d + 1;
    end loop;
  end loop;
end;
$$;
revoke all on function tern.settle_ternary_days() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule(
  'settle-ternary-days',
  '30 2 * * *',
  'select tern.settle_ternary_days()'
);

-- ------------------------------------------------------------ what the app calls

create or replace function tern.ternary_create(p_name text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  code text;
begin
  if not tern.has_plus() then raise exception 'Ternaries need Tern Plus'; end if;
  if tern.my_ternary() is not null then raise exception 'Already in a ternary'; end if;
  loop
    -- Six letters and digits, leaving out ones that look alike (0/O, 1/I/L).
    code := (
      select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::integer, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from tern.ternaries where invite_code = code);
  end loop;
  insert into tern.ternaries (name, invite_code) values (trim(p_name), code)
  returning id into new_id;
  insert into tern.ternary_members (ternary_id, user_id, display_name)
  values (new_id, auth.uid(), trim(p_display_name));
  return new_id;
end;
$$;

-- 'joined', 'not_found', 'full' or 'already'.
create or replace function tern.ternary_join(p_code text, p_display_name text, p_max integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not tern.has_plus() then raise exception 'Ternaries need Tern Plus'; end if;
  if tern.my_ternary() is not null then return 'already'; end if;
  select id into target from tern.ternaries where invite_code = upper(trim(p_code));
  if target is null then return 'not_found'; end if;
  if (select count(*) from tern.ternary_members where ternary_id = target) >= least(p_max, 14) then
    return 'full';
  end if;
  insert into tern.ternary_members (ternary_id, user_id, display_name)
  values (target, auth.uid(), trim(p_display_name));
  return 'joined';
end;
$$;

create or replace function tern.ternary_leave()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mine uuid := tern.my_ternary();
begin
  if mine is null then return; end if;
  delete from tern.ternary_members where ternary_id = mine and user_id = auth.uid();
  -- What you brought leaves with you; the settled days stay, so the bird never moves back.
  delete from tern.ternary_fish where ternary_id = mine and (from_user = auth.uid() or to_user = auth.uid());
  delete from tern.ternary_postcards where ternary_id = mine and from_user = auth.uid();
  delete from tern.ternary_dishes where ternary_id = mine and from_user = auth.uid();
  if not exists (select 1 from tern.ternary_members where ternary_id = mine) then
    delete from tern.ternaries where id = mine;
  end if;
end;
$$;

create or replace function tern.ternary_set_privacy(p_fly_privately boolean, p_share_resting boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  update tern.ternary_members
  set fly_privately = p_fly_privately, share_resting = p_share_resting
  where user_id = auth.uid();
$$;

-- Up to `p_max` fish a day (at most 3), to someone in your ternary who hasn't been blocked
-- either way. Fish earn nothing.
create or replace function tern.ternary_bring_fish(p_to uuid, p_day date, p_max integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mine uuid := tern.my_ternary();
begin
  if not tern.has_plus() then raise exception 'Ternaries need Tern Plus'; end if;
  if p_day < (now() at time zone 'utc')::date - 1 or p_day > (now() at time zone 'utc')::date + 1 then
    raise exception 'Only today can be recorded (got %)', p_day;
  end if;
  if mine is null or not exists (
    select 1 from tern.ternary_members where ternary_id = mine and user_id = p_to
  ) then
    raise exception 'Not in your ternary';
  end if;
  if exists (
    select 1 from tern.ternary_blocks
    where (blocker = auth.uid() and blocked = p_to) or (blocker = p_to and blocked = auth.uid())
  ) then
    return;
  end if;
  if (select count(*) from tern.ternary_fish where from_user = auth.uid() and day = p_day)
     >= least(p_max, 3) then
    raise exception 'That''s all the fish for today';
  end if;
  insert into tern.ternary_fish (ternary_id, from_user, to_user, day)
  values (mine, auth.uid(), p_to, p_day);
end;
$$;

create or replace function tern.ternary_send_postcard(p_stop_id text, p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mine uuid := tern.my_ternary();
begin
  if not tern.has_plus() then raise exception 'Ternaries need Tern Plus'; end if;
  if mine is null then raise exception 'Not in a ternary'; end if;
  insert into tern.ternary_postcards (ternary_id, from_user, stop_id, day)
  values (mine, auth.uid(), p_stop_id, p_day)
  on conflict do nothing;
end;
$$;

-- Brings (or swaps) your dish for the table the shared bird rests at.
create or replace function tern.ternary_bring_dish(p_stop text, p_name text, p_foods text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mine uuid := tern.my_ternary();
begin
  if not tern.has_plus() then raise exception 'Ternaries need Tern Plus'; end if;
  if mine is null then raise exception 'Not in a ternary'; end if;
  insert into tern.ternary_dishes (ternary_id, from_user, stop, name, foods)
  values (mine, auth.uid(), p_stop, trim(p_name), p_foods)
  on conflict (ternary_id, from_user, stop)
  do update set name = excluded.name, foods = excluded.foods, created_at = now();
end;
$$;

create or replace function tern.ternary_block(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into tern.ternary_blocks (blocker, blocked)
  values (auth.uid(), p_user)
  on conflict do nothing;
$$;

create or replace function tern.ternary_report(p_kind text, p_target text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into tern.ternary_reports (reporter, ternary_id, kind, target)
  values (auth.uid(), tern.my_ternary(), p_kind, p_target);
$$;

-- Everything the app shows about the caller's ternary, on their day `p_today`, or null.
create or replace function tern.ternary_state(p_today date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  mine uuid := tern.my_ternary();
  t record;
  me record;
  settled integer;
  live integer := 0;
  last_settled date;
  d date;
begin
  if mine is null then return null; end if;
  select * into t from tern.ternaries where id = mine;
  select * into me from tern.ternary_members where ternary_id = mine and user_id = auth.uid();

  select coalesce(sum(points), 0), max(day) into settled, last_settled
  from tern.ternary_days where ternary_id = mine;
  d := coalesce(last_settled + 1, (t.created_at at time zone 'utc')::date);
  while d <= p_today loop
    live := live + (select points from tern.ternary_day_points(mine, d));
    d := d + 1;
  end loop;

  return jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'inviteCode', t.invite_code,
    'total', settled + live,
    'flyPrivately', me.fly_privately,
    'shareResting', me.share_resting,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', m.user_id,
        'name', m.display_name,
        'you', m.user_id = auth.uid(),
        'presence', case
          -- Flying privately: still carries the bird, never drawn for anyone else.
          when m.user_id <> auth.uid() and m.fly_privately then null
          when exists (select 1 from tern.rest_days r where r.user_id = m.user_id and r.day = p_today)
               and (m.share_resting or m.user_id = auth.uid()) then 'resting'
          when tern.showed_up(m.user_id, p_today) then 'here'
          else null
        end
      ) order by m.joined_at)
      from tern.ternary_members m
      where m.ternary_id = mine
        and tern.user_has_plus(m.user_id)
        and not exists (
          select 1 from tern.ternary_blocks b
          where (b.blocker = auth.uid() and b.blocked = m.user_id)
             or (b.blocker = m.user_id and b.blocked = auth.uid())
        )
    ), '[]'::jsonb),
    'fish', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'fromName', fm.display_name, 'day', f.day)
        order by f.created_at desc)
      from tern.ternary_fish f
      join tern.ternary_members fm on fm.ternary_id = mine and fm.user_id = f.from_user
      where f.to_user = auth.uid() and f.ternary_id = mine and f.day >= p_today - 2
    ), '[]'::jsonb),
    'fishSentToday', (
      select count(*) from tern.ternary_fish f where f.from_user = auth.uid() and f.day = p_today
    ),
    'postcards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'fromName', pm.display_name, 'stopId', p.stop_id, 'day', p.day,
        'yours', p.from_user = auth.uid()
      ) order by p.created_at desc)
      from tern.ternary_postcards p
      join tern.ternary_members pm on pm.ternary_id = mine and pm.user_id = p.from_user
      where p.ternary_id = mine
        and not exists (
          select 1 from tern.ternary_blocks b
          where (b.blocker = auth.uid() and b.blocked = p.from_user)
             or (b.blocker = p.from_user and b.blocked = auth.uid())
        )
    ), '[]'::jsonb),
    'dishes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', x.id, 'fromName', xm.display_name, 'fromId', x.from_user, 'stop', x.stop,
        'name', x.name, 'foods', to_jsonb(x.foods), 'yours', x.from_user = auth.uid()
      ) order by x.created_at)
      from tern.ternary_dishes x
      join tern.ternary_members xm on xm.ternary_id = mine and xm.user_id = x.from_user
      where x.ternary_id = mine
        and not exists (
          select 1 from tern.ternary_blocks b
          where (b.blocker = auth.uid() and b.blocked = x.from_user)
             or (b.blocker = x.from_user and b.blocked = auth.uid())
        )
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function tern.ternary_create(text, text) from public, anon;
revoke all on function tern.ternary_join(text, text, integer) from public, anon;
revoke all on function tern.ternary_leave() from public, anon;
revoke all on function tern.ternary_set_privacy(boolean, boolean) from public, anon;
revoke all on function tern.ternary_bring_fish(uuid, date, integer) from public, anon;
revoke all on function tern.ternary_send_postcard(text, date) from public, anon;
revoke all on function tern.ternary_bring_dish(text, text, text[]) from public, anon;
revoke all on function tern.ternary_block(uuid) from public, anon;
revoke all on function tern.ternary_report(text, text) from public, anon;
revoke all on function tern.ternary_state(date) from public, anon;

grant execute on function tern.ternary_create(text, text) to authenticated;
grant execute on function tern.ternary_join(text, text, integer) to authenticated;
grant execute on function tern.ternary_leave() to authenticated;
grant execute on function tern.ternary_set_privacy(boolean, boolean) to authenticated;
grant execute on function tern.ternary_bring_fish(uuid, date, integer) to authenticated;
grant execute on function tern.ternary_send_postcard(text, date) to authenticated;
grant execute on function tern.ternary_bring_dish(text, text, text[]) to authenticated;
grant execute on function tern.ternary_block(uuid) to authenticated;
grant execute on function tern.ternary_report(text, text) to authenticated;
grant execute on function tern.ternary_state(date) to authenticated;
