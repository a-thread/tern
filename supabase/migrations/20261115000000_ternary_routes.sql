-- Ternaries choose which tracked migration their shared bird flies: the Greenland route (the
-- same as everyone's own journey) or the Dutch route (Fijn et al. 2013, about 90,000 km).
-- The routes themselves live in the app (src/domain/waypoints/models/routes.ts); the server
-- only remembers which one a ternary chose, since the shared bird's total is the same either
-- way and only where it's drawn differs.
--
-- Existing ternaries keep flying Greenland's. The two-argument `ternary_create` stays, so an
-- older build can still start a ternary (on Greenland's route); this adds a three-argument
-- one that takes the route. `ternary_state` is replaced to say which route it is.

alter table tern.ternaries
  add column route text not null default 'greenland'
  check (route in ('greenland', 'netherlands'));

create or replace function tern.ternary_create(p_name text, p_display_name text, p_route text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if p_route not in ('greenland', 'netherlands') then
    raise exception 'No route %', p_route;
  end if;
  -- The two-argument version checks Plus and that the caller is in no ternary yet.
  new_id := tern.ternary_create(p_name, p_display_name);
  update tern.ternaries set route = p_route where id = new_id;
  return new_id;
end;
$$;

revoke all on function tern.ternary_create(text, text, text) from public, anon;
grant execute on function tern.ternary_create(text, text, text) to authenticated;

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
    'route', t.route,
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
