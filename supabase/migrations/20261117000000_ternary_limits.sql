-- Limits the server holds on its own instead of taking the app's word for them. Both functions
-- are a `create or replace` with the same arguments, so the grants made in
-- 20261111000000_ternaries.sql still stand and older builds keep working.
--
-- - ternary_join: a ternary holds 8 people (TernaryRules.MAX_MEMBERS in the app). `p_max` is
--   still accepted, so older builds can call it, but it can only lower the limit, never raise it.
-- - ternary_send_postcard: the stop must look like a stop id, with or without its lap
--   ("2-iceland", "nl-channel"); the day must be today somewhere (UTC ± 1), as for fish; and
--   at most 30 postcards a day, enough for a whole migration's stops at once (26), so made-up
--   stop ids can't fill the table.

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
  if (select count(*) from tern.ternary_members where ternary_id = target)
     >= least(coalesce(p_max, 8), 8) then
    return 'full';
  end if;
  insert into tern.ternary_members (ternary_id, user_id, display_name)
  values (target, auth.uid(), trim(p_display_name));
  return 'joined';
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
  if p_stop_id is null or p_stop_id !~ '^([0-9]{1,4}-)?[a-z][a-z0-9-]{0,60}$' then
    raise exception 'Not a stop (got %)', p_stop_id;
  end if;
  if p_day is null
     or p_day < (now() at time zone 'utc')::date - 1
     or p_day > (now() at time zone 'utc')::date + 1 then
    raise exception 'Only today can be recorded (got %)', p_day;
  end if;
  if (select count(*) from tern.ternary_postcards
      where ternary_id = mine and from_user = auth.uid() and day = p_day) >= 30 then
    raise exception 'That''s all the postcards for today';
  end if;
  insert into tern.ternary_postcards (ternary_id, from_user, stop_id, day)
  values (mine, auth.uid(), p_stop_id, p_day)
  on conflict do nothing;
end;
$$;
