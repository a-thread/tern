-- Tern Plus, enforced. An account's log can be added to or changed only while it has
-- Plus; reading it and deleting it stay open, so someone whose Plus has ended can still
-- copy their log onto the phone, export it, and erase it or the account.
--
-- `entitlements` is written only by the server: the `plus` Edge Function (from RevenueCat's
-- webhook, or when the app asks it to look an account up) with the service role, or by hand
-- in the SQL Editor for a grant that RevenueCat doesn't know about:
--
--   insert into tern.entitlements (user_id, source) values ('<user id>', 'manual');
--
-- A manual row is never touched by the function, and with no expiry it lasts until deleted.

create table tern.entitlements (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  -- When Plus ends; null for a grant that doesn't.
  plus_expires_at timestamptz,
  source          text not null check (source in ('revenuecat', 'manual')),
  updated_at      timestamptz not null default now()
);

alter table tern.entitlements enable row level security;

create policy "read own entitlement" on tern.entitlements for select to authenticated
  using (user_id = auth.uid());

grant select on tern.entitlements to authenticated;
grant select, insert, update, delete on tern.entitlements to service_role;

-- A day's slack past the expiry: a renewal can reach the server a little after the old
-- period ends, and the app (which reads the store directly) shouldn't be refused meanwhile.
create or replace function tern.has_plus()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from tern.entitlements e
    where e.user_id = auth.uid()
      and (e.plus_expires_at is null or e.plus_expires_at > now() - interval '1 day')
  );
$$;

revoke all on function tern.has_plus() from public, anon;
grant execute on function tern.has_plus() to authenticated;

-- Every table of the log: the one "own rows, any command" policy becomes read and delete
-- for your own rows, and insert and update for your own rows while you have Plus.
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('settings', 'own settings'),
      ('food_entries', 'own food'),
      ('weight_entries', 'own weight'),
      ('waypoint_events', 'own waypoints'),
      ('rest_days', 'own rest days'),
      ('saved_meals', 'own saved meals'),
      ('medication_doses', 'own medication doses'),
      ('water_entries', 'own water entries'),
      ('mood_checkins', 'own mood check-ins'),
      ('skipped_meals', 'own skipped meals'),
      ('movement_entries', 'own movement'),
      ('skipped_weigh_ins', 'own skipped weigh-ins'),
      ('meal_checkins', 'own meal check-ins')
    ) as v(tbl, old_policy)
  loop
    execute format('drop policy if exists %I on tern.%I', t.old_policy, t.tbl);
    execute format(
      'create policy "read own" on tern.%I for select to authenticated using (user_id = auth.uid())',
      t.tbl);
    execute format(
      'create policy "delete own" on tern.%I for delete to authenticated using (user_id = auth.uid())',
      t.tbl);
    execute format(
      'create policy "add own with plus" on tern.%I for insert to authenticated with check (user_id = auth.uid() and tern.has_plus())',
      t.tbl);
    execute format(
      'create policy "change own with plus" on tern.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and tern.has_plus())',
      t.tbl);
  end loop;
end;
$$;
