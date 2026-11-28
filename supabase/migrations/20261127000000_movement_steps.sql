-- A walk, run or hike can be logged as steps instead of minutes, for steps taken without the
-- phone. Such an entry has 0 minutes, so it adds to the day's steps and not to its minutes.
alter table tern.movement_entries add column steps integer check (steps between 1 and 100000);

alter table tern.movement_entries drop constraint if exists movement_entries_minutes_check;
alter table tern.movement_entries
  add constraint movement_entries_minutes_check check (minutes between 0 and 600);
alter table tern.movement_entries
  add constraint movement_entries_minutes_or_steps check (minutes > 0 or steps is not null);

-- The import again (20261110000000_import_clamps_saved_meal_servings.sql), now carrying steps.
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
  -- Every insert below would be refused, and each refusal swallowed as a skipped row, so
  -- the caller would think it had been moved. Fail instead, so nothing is cleared.
  if not tern.has_plus() then
    raise exception 'Tern Plus is needed to add to an account';
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
      insert into tern.saved_meals (id, user_id, name, items, servings, created_at, updated_at)
      values (
        (r ->> 'id')::uuid, me, r ->> 'name', r -> 'items',
        least(greatest(round(coalesce((r ->> 'servings')::numeric, 1)), 1), 100)::integer,
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
        id, user_id, day, activity, minutes, effort, distance_m, steps, logged_at
      ) values (
        (r ->> 'id')::uuid, me, (r ->> 'day')::date, r ->> 'activity',
        (r ->> 'minutes')::integer, r ->> 'effort',
        round((r ->> 'distance_m')::numeric)::integer,
        round((r ->> 'steps')::numeric)::integer,
        coalesce((r ->> 'logged_at')::timestamptz, now())
      ) on conflict do nothing;
      get diagnostics n = row_count;
      added := added + n;
    exception when others then null;
    end;
  end loop;

  for r in select * from jsonb_array_elements(coalesce(copy -> 'dayNotes', '[]')) loop
    begin
      insert into tern.day_notes (user_id, day, note, updated_at)
      values (
        me, (r ->> 'day')::date, r ->> 'note',
        coalesce((r ->> 'updated_at')::timestamptz, now())
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
