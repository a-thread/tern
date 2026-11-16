-- Everyone chooses their bird: which of the eight flock looks (a pose in its own colour, see
-- src/journey/models/flockLooks.ts) they fly as on the map, in the list and on their
-- postcards' stamps. Until now a look was your place in the order people joined.
--
-- Ternaries haven't shipped in any build yet, so the old ways in are replaced rather than
-- kept alongside:
-- - ternary_members.look: 0 to 7, never two the same in one ternary. Anyone already in a
--   ternary gets their place, the look they had.
-- - ternary_create takes your look; the two- and three-argument versions are gone.
-- - ternary_join takes your look, or gives you the first free one if a friend already flies
--   it (you can't see which are taken before joining). It no longer takes a size from the
--   app: a ternary holds 8, one for each look. The three-argument version is gone.
-- - ternary_set_look changes your look later, if it's free.
-- - ternary_state says each member's look.

alter table tern.ternary_members add column look smallint;

update tern.ternary_members m
set look = ordered.place
from (
  select ternary_id, user_id,
         (row_number() over (partition by ternary_id order by joined_at) - 1)::smallint as place
  from tern.ternary_members
) ordered
where m.ternary_id = ordered.ternary_id and m.user_id = ordered.user_id;

alter table tern.ternary_members
  alter column look set not null,
  add constraint ternary_members_look_range check (look between 0 and 7),
  add constraint ternary_members_look_unique unique (ternary_id, look);

-- A look nobody in the ternary flies yet, lowest first; null when all eight are taken.
create or replace function tern.free_look(p_ternary uuid)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select l::smallint from generate_series(0, 7) l
  where not exists (
    select 1 from tern.ternary_members m where m.ternary_id = p_ternary and m.look = l
  )
  order by l
  limit 1;
$$;

revoke all on function tern.free_look(uuid) from public, anon, authenticated;

drop function tern.ternary_create(text, text, text);
drop function tern.ternary_create(text, text);

-- Starts a ternary flying `p_route`, with you in it as `p_look`.
create function tern.ternary_create(
  p_name text, p_display_name text, p_route text, p_look integer
)
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
  if p_route not in ('greenland', 'netherlands') then
    raise exception 'No route %', p_route;
  end if;
  if p_look is null or p_look not between 0 and 7 then
    raise exception 'No look % (0 to 7)', p_look;
  end if;
  loop
    -- Six letters and digits, leaving out ones that look alike (0/O, 1/I/L).
    code := (
      select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::integer, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from tern.ternaries where invite_code = code);
  end loop;
  insert into tern.ternaries (name, invite_code, route) values (trim(p_name), code, p_route)
  returning id into new_id;
  insert into tern.ternary_members (ternary_id, user_id, display_name, look)
  values (new_id, auth.uid(), trim(p_display_name), p_look);
  return new_id;
end;
$$;

revoke all on function tern.ternary_create(text, text, text, integer) from public, anon;
grant execute on function tern.ternary_create(text, text, text, integer) to authenticated;

drop function tern.ternary_join(text, text, integer);

-- Joins by code as `p_look`, or the first free look if a friend already flies it.
-- 'joined', 'not_found', 'full' or 'already'.
create function tern.ternary_join(p_code text, p_display_name text, p_look integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  v_look smallint;
begin
  if not tern.has_plus() then raise exception 'Ternaries need Tern Plus'; end if;
  if p_look is null or p_look not between 0 and 7 then
    raise exception 'No look % (0 to 7)', p_look;
  end if;
  if tern.my_ternary() is not null then return 'already'; end if;
  -- Locked, so two people joining at once can't both take the last place or the same look.
  select id into target from tern.ternaries where invite_code = upper(trim(p_code)) for update;
  if target is null then return 'not_found'; end if;
  if exists (select 1 from tern.ternary_members m where m.ternary_id = target and m.look = p_look) then
    v_look := tern.free_look(target);
  else
    v_look := p_look;
  end if;
  -- Eight looks, eight people: none free means the ternary is full.
  if v_look is null then return 'full'; end if;
  insert into tern.ternary_members (ternary_id, user_id, display_name, look)
  values (target, auth.uid(), trim(p_display_name), v_look);
  return 'joined';
end;
$$;

revoke all on function tern.ternary_join(text, text, integer) from public, anon;
grant execute on function tern.ternary_join(text, text, integer) to authenticated;

-- Changes your look to `p_look` if nobody else in your ternary flies it. False if it's taken,
-- including by someone you can't see (a person you've blocked, or who blocked you).
create function tern.ternary_set_look(p_look integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  mine uuid := tern.my_ternary();
begin
  if not tern.has_plus() then raise exception 'Ternaries need Tern Plus'; end if;
  if mine is null then raise exception 'Not in a ternary'; end if;
  if p_look is null or p_look not between 0 and 7 then
    raise exception 'No look % (0 to 7)', p_look;
  end if;
  if exists (
    select 1 from tern.ternary_members m
    where m.ternary_id = mine and m.look = p_look and m.user_id <> auth.uid()
  ) then
    return false;
  end if;
  update tern.ternary_members set look = p_look
  where ternary_id = mine and user_id = auth.uid();
  return true;
exception
  -- Someone else took it at the same moment.
  when unique_violation then return false;
end;
$$;

revoke all on function tern.ternary_set_look(integer) from public, anon;
grant execute on function tern.ternary_set_look(integer) to authenticated;

-- Everything the app shows about the caller's ternary, on their day `p_today`, or null.
-- `p_today` must be today somewhere (UTC ± 1): another day would show who showed up then,
-- and friends' past days are never shown. As in 20261116000000, with each member's look.
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
        'look', m.look,
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
        'id', p.id, 'fromName', pm.display_name, 'fromId', p.from_user, 'stopId', p.stop_id,
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
