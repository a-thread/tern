-- Sharing more than one meal at a stop. Until now each person had one per stop, and sharing
-- again swapped it.
--
-- - Up to 5 meals each per stop (TernaryRules.MAX_MEALS_PER_STOP in the app). Sharing a meal
--   with the same name again updates its foods instead of adding a second.
-- - ternary_remove_dish takes back a meal you shared, now that sharing no longer swaps.

alter table tern.ternary_dishes
  drop constraint if exists ternary_dishes_ternary_id_from_user_stop_key;

-- Duplicates by name can't exist yet (one meal each per stop), so this always applies.
alter table tern.ternary_dishes
  add constraint ternary_dishes_one_per_name unique (ternary_id, from_user, stop, name);

-- Shares a meal at the stop the shared bird rests at; the same name again updates its foods.
create or replace function tern.ternary_bring_dish(p_stop text, p_name text, p_foods text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  mine uuid := tern.my_ternary();
  dish_name text := trim(p_name);
begin
  if not tern.has_plus() then raise exception 'Ternaries need Tern Plus'; end if;
  if mine is null then raise exception 'Not in a ternary'; end if;
  if exists (select 1 from unnest(p_foods) f where f is null or char_length(f) not between 1 and 80) then
    raise exception 'Each food is a name of 1 to 80 characters';
  end if;
  if not exists (
    select 1 from tern.ternary_dishes
    where ternary_id = mine and from_user = auth.uid() and stop = p_stop and name = dish_name
  ) and (
    select count(*) from tern.ternary_dishes
    where ternary_id = mine and from_user = auth.uid() and stop = p_stop
  ) >= 5 then
    raise exception 'That''s all the meals you can share at this stop';
  end if;
  insert into tern.ternary_dishes (ternary_id, from_user, stop, name, foods)
  values (mine, auth.uid(), p_stop, dish_name, p_foods)
  on conflict (ternary_id, from_user, stop, name)
  do update set foods = excluded.foods, created_at = now();
end;
$$;

-- Takes back a meal you shared. Only your own; nothing happens for anyone else's.
create function tern.ternary_remove_dish(p_dish uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from tern.ternary_dishes
  where id = p_dish and from_user = auth.uid() and ternary_id = tern.my_ternary();
end;
$$;

revoke all on function tern.ternary_remove_dish(uuid) from public, anon;
grant execute on function tern.ternary_remove_dish(uuid) to authenticated;
