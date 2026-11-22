-- Row level security, made cheap on big tables. A bare `auth.uid()` or `tern.has_plus()` in a
-- policy can be evaluated once per row; wrapped in `(select …)` Postgres works it out once per
-- statement and reuses it (an initPlan), which is what Supabase recommends. The rules
-- themselves don't change: same policies, same names, same roles, only the expressions.

do $$
declare
  t text;
begin
  foreach t in array array[
    'settings',
    'food_entries',
    'weight_entries',
    'waypoint_events',
    'rest_days',
    'saved_meals',
    'medication_doses',
    'water_entries',
    'mood_checkins',
    'skipped_meals',
    'movement_entries',
    'skipped_weigh_ins',
    'meal_checkins',
    'day_notes'
  ]
  loop
    execute format(
      'alter policy "read own" on tern.%I using (user_id = (select auth.uid()))',
      t);
    execute format(
      'alter policy "delete own" on tern.%I using (user_id = (select auth.uid()))',
      t);
    execute format(
      'alter policy "add own with plus" on tern.%I with check (user_id = (select auth.uid()) and (select tern.has_plus()))',
      t);
    execute format(
      'alter policy "change own with plus" on tern.%I using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and (select tern.has_plus()))',
      t);
  end loop;
end;
$$;

alter policy "read own entitlement" on tern.entitlements
  using (user_id = (select auth.uid()));
