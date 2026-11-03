-- A free-text note per day: how the body felt, what shaped the day. One row per user per
-- local day, up to 500 characters; writing again the same day replaces it. Like movement,
-- only today or yesterday can be written, except by an import. Adding and changing need
-- Tern Plus, as every other table of the log does (20261023000000_plus_entitlements.sql).

create table tern.day_notes (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day         date not null,
  note        text not null check (char_length(note) between 1 and 500),
  updated_at  timestamptz not null default now(),
  primary key (user_id, day)
);

alter table tern.day_notes enable row level security;

create policy "read own" on tern.day_notes for select to authenticated
  using (user_id = auth.uid());
create policy "delete own" on tern.day_notes for delete to authenticated
  using (user_id = auth.uid());
create policy "add own with plus" on tern.day_notes for insert to authenticated
  with check (user_id = auth.uid() and tern.has_plus());
create policy "change own with plus" on tern.day_notes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and tern.has_plus());

grant select, insert, update, delete on tern.day_notes to authenticated;

create trigger day_notes_recent_day
  before insert or update on tern.day_notes
  for each row execute function tern.require_today_or_yesterday();

-- The import (20261022000000_import_my_data.sql) again, now reading `dayNotes` too.
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
