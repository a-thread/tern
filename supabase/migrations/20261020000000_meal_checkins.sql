-- Meal check-ins: how a meal sat, recorded after eating. One row per user, local
-- day and meal: fullness and how you feel, each on a 1-5 scale. Optional (off
-- by default in settings) and separate from the daily mood check-in. It earns no
-- waypoint. Checking in on the same meal again replaces that row.

create table tern.meal_checkins (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day         date not null,
  meal        text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  fullness    smallint not null check (fullness between 1 and 5),
  feeling     smallint not null check (feeling between 1 and 5),
  updated_at  timestamptz not null default now(),
  primary key (user_id, day, meal)
);

alter table tern.meal_checkins enable row level security;

create policy "own meal check-ins" on tern.meal_checkins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on tern.meal_checkins to authenticated;
