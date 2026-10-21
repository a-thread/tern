-- Moving a log into an account: the phone's own database when someone takes out Tern
-- Plus, or an exported file restored from Settings. Everything is added and nothing is
-- overwritten: a row the account already has (same id, or the same day's rest day, or the
-- same day and meal's check-in) is left as it is, and a row that doesn't fit its table is
-- skipped rather than failing the rest. Settings are taken only if the account has none.
--
-- History is the point, so the "only today" triggers on the ledger, rest days and movement
-- stand aside while an import runs. They read a setting that only this function sets, for
-- its own transaction; a client can't set it, since PostgREST runs no SQL of its own and
-- set_config isn't in an exposed schema. Points still have to match their source (the
-- waypoint_events_points_check constraint), so an import can't award anything the app
-- couldn't. Security invoker: row-level security applies, and every row is the caller's.

create or replace function tern.require_recent_day()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('tern.importing', true) = 'on' then
    return new;
  end if;
  if new.day < (now() at time zone 'utc')::date - 1
     or new.day > (now() at time zone 'utc')::date + 1 then
    raise exception 'Only today can be recorded (got %)', new.day;
  end if;
  return new;
end;
$$;

create or replace function tern.require_today_or_yesterday()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('tern.importing', true) = 'on' then
    return new;
  end if;
  if new.day < (now() at time zone 'utc')::date - 2
     or new.day > (now() at time zone 'utc')::date + 1 then
    raise exception 'Only today or yesterday can be recorded (got %)', new.day;
  end if;
  return new;
end;
$$;

-- `copy` is an export (src/domain/settings/models/ternExport.ts). Returns how many rows
-- were added, settings not counted.
create or replace function tern.import_my_data(copy jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  r jsonb;
  added integer := 0;
  n integer;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;
  perform set_config('tern.importing', 'on', true);

  for r in select * from jsonb_array_elements(coalesce(copy -> 'food', '[]')) loop
    begin
      insert into tern.food_entries (
        id, user_id, logged_on, meal, name, brand, servings, serving_label,
        calories, protein, carbs, fat, tier, tier_overridden, measure, created_at
      ) values (
        (r ->> 'id')::uuid, me, (r ->> 'logged_on')::date, r ->> 'meal', r ->> 'name',
        r ->> 'brand', (r ->> 'servings')::numeric, r ->> 'serving_label',
        (r ->> 'calories')::numeric, (r ->> 'protein')::numeric,
        (r ->> 'carbs')::numeric, (r ->> 'fat')::numeric, (r ->> 'tier')::smallint,
        coalesce((r ->> 'tier_overridden')::boolean, false),
        case when jsonb_typeof(r -> 'measure') = 'object' then r -> 'measure' end,
        coalesce((r ->> 'created_at')::timestamptz, now())
      ) on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'skippedMeals', '[]')) loop
    begin
      insert into tern.skipped_meals (user_id, day, meal)
      values (me, (r ->> 'day')::date, r ->> 'meal')
      on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'savedMeals', '[]')) loop
    begin
      insert into tern.saved_meals (id, user_id, name, items, created_at, updated_at)
      values (
        (r ->> 'id')::uuid, me, r ->> 'name', r -> 'items',
        coalesce((r ->> 'created_at')::timestamptz, now()),
        coalesce((r ->> 'updated_at')::timestamptz, now())
      ) on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'weight', '[]')) loop
    begin
      insert into tern.weight_entries (id, user_id, lb, logged_at)
      values ((r ->> 'id')::uuid, me, (r ->> 'lb')::numeric, (r ->> 'logged_at')::timestamptz)
      on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'skippedWeighIns', '[]')) loop
    begin
      insert into tern.skipped_weigh_ins (user_id, day)
      values (me, (r ->> 'day')::date)
      on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'waypoints', '[]')) loop
    begin
      insert into tern.waypoint_events (user_id, source, day, points)
      values (me, r ->> 'source', (r ->> 'day')::date, (r ->> 'points')::integer)
      on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'restDays', '[]')) loop
    begin
      insert into tern.rest_days (user_id, day)
      values (me, (r ->> 'day')::date)
      on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'medicationDoses', '[]')) loop
    begin
      insert into tern.medication_doses (user_id, medication_id, day)
      values (me, r ->> 'medication_id', (r ->> 'day')::date)
      on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'waterEntries', '[]')) loop
    begin
      insert into tern.water_entries (id, user_id, oz, logged_on, logged_at)
      values (
        (r ->> 'id')::uuid, me, (r ->> 'oz')::numeric, (r ->> 'logged_on')::date,
        coalesce((r ->> 'logged_at')::timestamptz, now())
      ) on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'moodCheckins', '[]')) loop
    begin
      insert into tern.mood_checkins (user_id, day, mood, stress, updated_at)
      values (
        me, (r ->> 'day')::date, (r ->> 'mood')::smallint, (r ->> 'stress')::smallint,
        coalesce((r ->> 'updated_at')::timestamptz, now())
      ) on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'mealCheckins', '[]')) loop
    begin
      insert into tern.meal_checkins (user_id, day, meal, fullness, feeling, note, updated_at)
      values (
        me, (r ->> 'day')::date, r ->> 'meal', (r ->> 'fullness')::smallint,
        (r ->> 'feeling')::smallint, r ->> 'note',
        coalesce((r ->> 'updated_at')::timestamptz, now())
      ) on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'movementEntries', '[]')) loop
    begin
      insert into tern.movement_entries (
        id, user_id, day, activity, minutes, effort, distance_m, logged_at
      ) values (
        (r ->> 'id')::uuid, me, (r ->> 'day')::date, r ->> 'activity',
        (r ->> 'minutes')::integer, r ->> 'effort',
        round((r ->> 'distance_m')::numeric)::integer,
        coalesce((r ->> 'logged_at')::timestamptz, now())
      ) on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  if jsonb_typeof(copy -> 'settings') = 'object' then
    insert into tern.settings (user_id, data) values (me, copy -> 'settings')
    on conflict do nothing;
  end if;

  return added;
end;
$$;

revoke all on function tern.import_my_data(jsonb) from public, anon;
grant execute on function tern.import_my_data(jsonb) to authenticated;
