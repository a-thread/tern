-- Fixes to 20261128120000_ternary_more_meals and 20261128130000_ternary_recipe_amounts from
-- review, as their own migration in case those have already run.
--
-- - The old one-meal-per-stop constraint is found by its columns, not a guessed name, so it's
--   dropped however it was named. (Left in place, a second meal at a stop always failed.)
-- - ternary_bring_dish locks your membership row before counting, so two shares at once
--   can't both slip under the limit of 5. The three-argument version calls this one.

do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'tern.ternary_dishes'::regclass
      and con.contype = 'u'
      and (
        select array_agg(att.attname::text order by att.attname)
        from unnest(con.conkey) k
        join pg_attribute att on att.attrelid = con.conrelid and att.attnum = k
      ) = array['from_user', 'stop', 'ternary_id']
  loop
    execute format('alter table tern.ternary_dishes drop constraint %I', c.conname);
  end loop;
end;
$$;

create or replace function tern.ternary_bring_dish(
  p_stop text, p_name text, p_foods text[], p_items jsonb, p_servings integer
)
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
  if p_servings is null or p_servings not between 1 and 100 then
    raise exception 'A recipe makes 1 to 100 servings';
  end if;
  -- One share at a time per person, so the count below can't be raced past.
  perform 1 from tern.ternary_members
  where ternary_id = mine and user_id = auth.uid()
  for update;
  if not exists (
    select 1 from tern.ternary_dishes
    where ternary_id = mine and from_user = auth.uid() and stop = p_stop and name = dish_name
  ) and (
    select count(*) from tern.ternary_dishes
    where ternary_id = mine and from_user = auth.uid() and stop = p_stop
  ) >= 5 then
    raise exception 'That''s all the meals you can share at this stop';
  end if;
  insert into tern.ternary_dishes (ternary_id, from_user, stop, name, foods, items, servings)
  values (mine, auth.uid(), p_stop, dish_name, p_foods, p_items, p_servings)
  on conflict (ternary_id, from_user, stop, name)
  do update set foods = excluded.foods, items = excluded.items,
                servings = excluded.servings, created_at = now();
end;
$$;
