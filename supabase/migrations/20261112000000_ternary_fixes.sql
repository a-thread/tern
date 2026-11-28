-- Fixes to 20261111000000_ternaries.sql from review, as their own migration since that one
-- has already run. Every function here is a `create or replace`, so the grants made there
-- still stand; only `ternary_unblock` is new.
--
-- - ternary_join: locks the ternary while counting, so two people joining at once can't
--   both take the last place.
-- - ternary_bring_dish: each food is a name of 1 to 80 characters.
-- - ternary_unblock: undoes a block you made.
-- - ternary_state: refuses any day but today (UTC ± 1), so friends' past days can't be
--   read and the live count can't be made to run for years; leaves out fish from anyone
--   blocked either way; sends postcards without a day; lists who you've blocked.

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
  -- Locked, so two people joining at once can't both take the last place.
  select id into target from tern.ternaries where invite_code = upper(trim(p_code)) for update;
  if target is null then return 'not_found'; end if;
  if (select count(*) from tern.ternary_members where ternary_id = target) >= least(p_max, 14) then
    return 'full';
  end if;
  insert into tern.ternary_members (ternary_id, user_id, display_name)
  values (target, auth.uid(), trim(p_display_name));
  return 'joined';
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
  if exists (select 1 from unnest(p_foods) f where f is null or char_length(f) not between 1 and 80) then
    raise exception 'Each food is a name of 1 to 80 characters';
  end if;
  insert into tern.ternary_dishes (ternary_id, from_user, stop, name, foods)
  values (mine, auth.uid(), p_stop, trim(p_name), p_foods)
  on conflict (ternary_id, from_user, stop)
  do update set name = excluded.name, foods = excluded.foods, created_at = now();
end;
$$;

create or replace function tern.ternary_unblock(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from tern.ternary_blocks where blocker = auth.uid() and blocked = p_user;
$$;

-- Everything the app shows about the caller's ternary, on their day `p_today`, or null.
-- `p_today` must be today somewhere (UTC ± 1): another day would show who showed up then,
-- and friends' past days are never shown.
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
  if p_today < (now() at time zone 'utc')::date - 1 or p_today > (now() at time zone 'utc')::date + 1 then
    raise exception 'Only today can be shown (got %)', p_today;
  end if;
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
        and not exists (
          select 1 from tern.ternary_blocks b
          where (b.blocker = auth.uid() and b.blocked = f.from_user)
             or (b.blocker = f.from_user and b.blocked = auth.uid())
        )
    ), '[]'::jsonb),
    'fishSentToday', (
      select count(*) from tern.ternary_fish f where f.from_user = auth.uid() and f.day = p_today
    ),
    'postcards', coalesce((
      select jsonb_agg(jsonb_build_object(
        -- No day: a postcard never says when someone got there.
        'id', p.id, 'fromName', pm.display_name, 'stopId', p.stop_id,
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
    ), '[]'::jsonb),
    -- Who you've blocked, so it can be undone. Never who has blocked you.
    'blocked', coalesce((
      select jsonb_agg(jsonb_build_object('userId', bm.user_id, 'name', bm.display_name)
        order by bm.joined_at)
      from tern.ternary_blocks b
      join tern.ternary_members bm on bm.ternary_id = mine and bm.user_id = b.blocked
      where b.blocker = auth.uid()
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function tern.ternary_unblock(uuid) from public, anon;
grant execute on function tern.ternary_unblock(uuid) to authenticated;
