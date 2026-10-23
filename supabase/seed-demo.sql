-- Demo data for screenshots: about two months of a made-up person's log ("Maya"),
-- ending today. Not a migration; run it by hand in the SQL Editor.
--
-- 1. Sign up a throwaway account in the app (e.g. demo@example.com) and confirm it.
-- 2. Set `demo_email`, `tz` and `gaining` below, then run the whole file.
--
-- Re-running is safe: it first erases that account's tern.* rows (and only that
-- account's), then writes everything again relative to today. It also grants the account
-- Plus by hand so it can be edited in the app.
--
-- Run the app with EXPO_PUBLIC_SAMPLE_STEPS=1 in .env so steps are sample ones, not the
-- phone's own; without it, step reading shows your real steps. Workout reading is off, so
-- the phone's workouts stay out too. Goal days come from logged movement either way.

do $$
declare
  demo_email constant text := 'maya@demo.com';
  -- The phone's time zone, so "today" here is the phone's today.
  tz constant text := 'America/New_York';
  days constant integer := 60;
  -- false: losing, ~185 lb down toward a 165 lb goal. true: gaining, ~132 lb up toward
  -- 145 lb, on a higher target with bigger lunches and dinners and a protein shake on
  -- snack days.
  gaining constant boolean := false;
  portion constant numeric := case when gaining then 1.5 else 1 end;

  me uuid;
  today date := (now() at time zone tz)::date;
  d date;
  n integer;          -- 0 = the oldest day, days - 1 = today
  is_today boolean;
  is_rest boolean;
  ts timestamptz;

  breakfasts jsonb := '[
    {"name":"Greek yogurt","brand":"Fage","label":"1 cup","cal":190,"p":18,"c":8,"f":10,"tier":2},
    {"name":"Oatmeal with blueberries","brand":null,"label":"1 bowl","cal":310,"p":9,"c":54,"f":6,"tier":1},
    {"name":"Scrambled eggs","brand":null,"label":"2 eggs","cal":200,"p":13,"c":2,"f":15,"tier":1},
    {"name":"Whole wheat toast with peanut butter","brand":null,"label":"1 slice","cal":260,"p":10,"c":24,"f":14,"tier":2},
    {"name":"Banana","brand":null,"label":"1 medium","cal":105,"p":1,"c":27,"f":0,"tier":1}
  ]';
  lunches jsonb := '[
    {"name":"Turkey sandwich","brand":null,"label":"1 sandwich","cal":420,"p":28,"c":44,"f":13,"tier":3},
    {"name":"Chicken Caesar salad","brand":null,"label":"1 bowl","cal":470,"p":34,"c":16,"f":29,"tier":2},
    {"name":"Lentil soup","brand":"Amy''s","label":"1 can","cal":300,"p":16,"c":46,"f":6,"tier":3},
    {"name":"Burrito bowl","brand":"Chipotle","label":"1 bowl","cal":640,"p":38,"c":70,"f":21,"tier":3},
    {"name":"Tuna salad on greens","brand":null,"label":"1 plate","cal":380,"p":32,"c":10,"f":23,"tier":2},
    {"name":"Leftover pasta primavera","brand":null,"label":"1.5 cups","cal":450,"p":14,"c":68,"f":13,"tier":2}
  ]';
  dinners jsonb := '[
    {"name":"Grilled salmon","brand":null,"label":"6 oz","cal":350,"p":40,"c":0,"f":20,"tier":1},
    {"name":"Roast chicken with vegetables","brand":null,"label":"1 plate","cal":520,"p":45,"c":28,"f":24,"tier":1},
    {"name":"Veggie stir-fry with tofu","brand":null,"label":"1 plate","cal":430,"p":22,"c":46,"f":17,"tier":1},
    {"name":"Spaghetti bolognese","brand":null,"label":"1.5 cups","cal":610,"p":30,"c":72,"f":20,"tier":2},
    {"name":"Black bean tacos","brand":null,"label":"2 tacos","cal":480,"p":18,"c":60,"f":18,"tier":2},
    {"name":"Margherita pizza","brand":null,"label":"2 slices","cal":560,"p":22,"c":66,"f":22,"tier":3},
    {"name":"Shrimp fried rice","brand":null,"label":"1.5 cups","cal":540,"p":26,"c":70,"f":16,"tier":3}
  ]';
  snacks jsonb := '[
    {"name":"Apple","brand":null,"label":"1 medium","cal":95,"p":0,"c":25,"f":0,"tier":1},
    {"name":"Almonds","brand":null,"label":"1 oz","cal":165,"p":6,"c":6,"f":14,"tier":1},
    {"name":"String cheese","brand":"Organic Valley","label":"1 stick","cal":80,"p":7,"c":1,"f":6,"tier":2},
    {"name":"Hummus and carrots","brand":null,"label":"1 snack pack","cal":150,"p":4,"c":14,"f":9,"tier":2},
    {"name":"Dark chocolate","brand":"Lindt","label":"2 squares","cal":120,"p":2,"c":9,"f":9,"tier":4}
  ]';
  workouts constant text[] := array['bike', 'yoga', 'strength', 'swim', 'hiit', 'pilates'];
  efforts constant text[] := array['easy', 'moderate', 'hard'];
  sips constant numeric[] := array[12, 16, 8, 20, 16, 12];
  notes constant text[] := array[
    'Ate too fast, felt heavy after.',
    'Perfect amount.',
    'Still hungry an hour later.',
    'Good energy all afternoon.'
  ];

  f jsonb;
  meal text;
  meals_covered integer;
  oz numeric;
  drinks integer;
  minutes integer;
  goal_days integer := 0;
  bonus integer;
begin
  select id into me from auth.users where email = demo_email;
  if me is null then
    raise exception 'No account for %; sign it up in the app first', demo_email;
  end if;

  -- Past days are history, so the "only today" triggers stand aside (as for an import).
  perform set_config('tern.importing', 'on', true);

  delete from tern.food_entries      where user_id = me;
  delete from tern.skipped_meals     where user_id = me;
  delete from tern.weight_entries    where user_id = me;
  delete from tern.skipped_weigh_ins where user_id = me;
  delete from tern.waypoint_events   where user_id = me;
  delete from tern.rest_days         where user_id = me;
  delete from tern.saved_meals       where user_id = me;
  delete from tern.medication_doses  where user_id = me;
  delete from tern.water_entries     where user_id = me;
  delete from tern.mood_checkins     where user_id = me;
  delete from tern.meal_checkins     where user_id = me;
  delete from tern.movement_entries  where user_id = me;

  insert into tern.entitlements (user_id, source) values (me, 'manual')
  on conflict (user_id) do nothing;

  insert into tern.settings (user_id, data, updated_at)
  values (me, jsonb_build_object(
    'firstName', 'Maya',
    'stepGoal', 7000,
    'stepGoalHistory', jsonb_build_array(
      jsonb_build_object('from', '0000-00-00', 'goal', 6000),
      jsonb_build_object('from', to_char(today - 30, 'YYYY-MM-DD'), 'goal', 7000)
    ),
    'calorieTarget', case when gaining then 2600 else 1900 end,
    'macroTargets', case when gaining
      then jsonb_build_object('protein', 130, 'carbs', 325, 'fat', 87)
      else jsonb_build_object('protein', 120, 'carbs', 210, 'fat', 63) end,
    'weightGoalLb', case when gaining then 145 else 165 end,
    'aim', case when gaining then 'gain' else 'loseSlowly' end,
    'weighInFrequency', 'daily',
    'restDaysPerWeek', 2,
    'trackWater', true,
    'waterGoalOz', 64,
    'trackMood', true,
    'checkInAfterMeals', true,
    'trackMovement', true,
    'movementGoalMinutes', 30,
    'medications', jsonb_build_array(jsonb_build_object(
      'id', 'demo-vitamin-d', 'name', 'Vitamin D', 'at', 480,
      'frequency', 'daily', 'weekday', 1, 'remind', true
    )),
    'healthData', jsonb_build_object('readSteps', true, 'readWorkouts', false)
  ), now())
  on conflict (user_id) do update set data = excluded.data, updated_at = now();

  insert into tern.saved_meals (user_id, name, items) values
  (me, 'Usual breakfast', '[
    {"name":"Greek yogurt","brand":"Fage","servings":1,"servingLabel":"1 cup","calories":190,"protein":18,"carbs":8,"fat":10,"tier":2},
    {"name":"Banana","servings":1,"servingLabel":"1 medium","calories":105,"protein":1,"carbs":27,"fat":0,"tier":1}
  ]'),
  (me, 'Salmon night', '[
    {"name":"Grilled salmon","servings":1,"servingLabel":"6 oz","calories":350,"protein":40,"carbs":0,"fat":20,"tier":1},
    {"name":"Brown rice","servings":1,"servingLabel":"1 cup","calories":215,"protein":5,"carbs":45,"fat":2,"tier":1},
    {"name":"Steamed broccoli","servings":1,"servingLabel":"1 cup","calories":55,"protein":4,"carbs":11,"fat":1,"tier":1}
  ]');

  for n in 0 .. days - 1 loop
    d := today - (days - 1 - n);
    is_today := d = today;
    is_rest := extract(isodow from d) = 7 and not is_today;  -- Sundays
    meals_covered := 0;

    -- Food. Today is half done: breakfast and lunch so far.
    foreach meal in array array['breakfast', 'lunch', 'dinner', 'snack'] loop
      continue when is_today and meal in ('dinner', 'snack');
      continue when meal = 'snack' and n % 3 = 1;
      if meal = 'breakfast' and n % 11 = 5 then
        insert into tern.skipped_meals (user_id, day, meal) values (me, d, 'breakfast');
        meals_covered := meals_covered + 1;
        continue;
      end if;

      f := case meal
        when 'breakfast' then breakfasts -> (n % jsonb_array_length(breakfasts))
        when 'lunch'     then lunches    -> ((n * 5) % jsonb_array_length(lunches))
        when 'dinner'    then dinners    -> ((n * 3) % jsonb_array_length(dinners))
        else                  snacks     -> ((n * 2) % jsonb_array_length(snacks))
      end;
      ts := (d + case meal when 'breakfast' then time '07:45' when 'lunch' then time '12:30'
                           when 'dinner' then time '18:45' else time '15:30' end) at time zone tz;
      insert into tern.food_entries
        (user_id, logged_on, meal, name, brand, servings, serving_label,
         calories, protein, carbs, fat, tier, created_at)
      values
        (me, d, meal, f ->> 'name', f ->> 'brand',
         case when meal in ('lunch', 'dinner') then portion else 1 end, f ->> 'label',
         (f ->> 'cal')::numeric, (f ->> 'p')::numeric, (f ->> 'c')::numeric,
         (f ->> 'f')::numeric, (f ->> 'tier')::smallint, ts);
      -- A second item on most breakfasts.
      if meal = 'breakfast' and n % 2 = 0 then
        insert into tern.food_entries
          (user_id, logged_on, meal, name, servings, serving_label,
           calories, protein, carbs, fat, tier, created_at)
        values (me, d, 'breakfast', 'Coffee with milk', 1, '12 oz', 45, 2, 4, 2, 1, ts);
      end if;
      if meal = 'snack' and gaining then
        insert into tern.food_entries
          (user_id, logged_on, meal, name, brand, servings, serving_label,
           calories, protein, carbs, fat, tier, created_at)
        values (me, d, 'snack', 'Protein shake with banana', 'Fairlife', 1, '1 bottle + 1 banana',
                255, 31, 33, 3, 3, ts);
      end if;

      if meal <> 'snack' then
        meals_covered := meals_covered + 1;
        insert into tern.waypoint_events (user_id, source, points, day) values (me, meal, 5, d);
      end if;
      if meal in ('lunch', 'dinner') and n % 4 <> 3 then
        insert into tern.meal_checkins (user_id, day, meal, fullness, feeling, note, updated_at)
        values (me, d, meal, 3 + n % 2, 3 + (n + length(meal)) % 3,
                case when n % 6 = 0 then notes[1 + (n / 6) % array_length(notes, 1)] end,
                ts + interval '45 minutes');
      end if;
    end loop;
    if meals_covered = 3 then
      insert into tern.waypoint_events (user_id, source, points, day) values (me, 'meals', 15, d);
    end if;

    -- Weigh-ins: most mornings. A slow trend toward the goal (about 3.5 lb lost or 2.5 lb
    -- gained over the two months) under day-to-day swings of a couple of pounds: a few
    -- overlapping waves for water weight, and a bump the morning after the weekend.
    if n % 4 = 2 and not is_today then
      insert into tern.skipped_weigh_ins (user_id, day) values (me, d);
    else
      insert into tern.weight_entries (user_id, lb, logged_at)
      values (me, round((case when gaining then 134.0 + n * 0.042 else 181.0 - n * 0.06 end
                         + 0.9 * sin(n * 1.3)
                         + 0.6 * sin(n * 0.45 + 1)
                         + 0.4 * cos(n * 2.7)
                         + case when extract(isodow from d) = 1 then 0.8 else 0 end)::numeric, 1),
              (d + time '07:10') at time zone tz);
      insert into tern.waypoint_events (user_id, source, points, day) values (me, 'weight', 5, d);
    end if;

    -- Water.
    drinks := case when is_today then 2 else 4 + n % 3 end;
    oz := 0;
    for i in 1 .. drinks loop
      insert into tern.water_entries (user_id, oz, logged_on, logged_at)
      values (me, sips[1 + (n + i) % array_length(sips, 1)], d,
              (d + time '08:00' + (i * interval '2 hours 10 minutes')) at time zone tz);
      oz := oz + sips[1 + (n + i) % array_length(sips, 1)];
    end loop;
    if oz >= 64 then
      insert into tern.waypoint_events (user_id, source, points, day) values (me, 'water', 10, d);
    end if;

    -- Mood and stress.
    insert into tern.mood_checkins (user_id, day, mood, stress, updated_at)
    values (me, d,
            greatest(1, least(10, 7 + round(1.6 * sin(n * 0.7))::int - case when n % 9 = 4 then 2 else 0 end)),
            greatest(1, least(10, 4 + round(1.8 * cos(n * 0.5))::int + case when n % 9 = 4 then 2 else 0 end)),
            (d + time '21:00') at time zone tz);
    insert into tern.waypoint_events (user_id, source, points, day) values (me, 'mood', 10, d);

    -- Medication: missed now and then.
    if n % 9 <> 7 then
      insert into tern.medication_doses (user_id, medication_id, day, taken_at)
      values (me, 'demo-vitamin-d', d, (d + time '08:05') at time zone tz);
      insert into tern.waypoint_events (user_id, source, points, day) values (me, 'medication', 10, d);
    end if;

    -- Movement, or a rest day on Sundays. Nothing logged yet today.
    if is_rest then
      insert into tern.rest_days (user_id, day) values (me, d);
      insert into tern.waypoint_events (user_id, source, points, day) values (me, 'rest', 10, d);
    elsif not is_today then
      minutes := 30 + (n * 7) % 30;
      insert into tern.movement_entries (user_id, day, activity, minutes, effort, distance_m, logged_at)
      values (me, d, workouts[1 + n % array_length(workouts, 1)], minutes,
              efforts[1 + n % 3],
              case when workouts[1 + n % array_length(workouts, 1)] = 'bike' then minutes * 320 end,
              (d + time '17:30') at time zone tz);
      if n % 3 = 0 then
        insert into tern.movement_entries (user_id, day, activity, minutes, effort, distance_m, logged_at)
        values (me, d, 'walk', 25, 'easy', 2400, (d + time '19:45') at time zone tz);
      end if;
      insert into tern.waypoint_events (user_id, source, points, day) values (me, 'movement', 10, d);
      insert into tern.waypoint_events (user_id, source, points, day) values (me, 'steps', 40, d);

      goal_days := goal_days + 1;
      bonus := case goal_days when 7 then 25 when 14 then 40 when 30 then 75
                              when 60 then 100 else 0 end;
      if bonus > 0 then
        insert into tern.waypoint_events (user_id, source, points, day) values (me, 'streak', bonus, d);
      end if;
    end if;
  end loop;
end;
$$;
