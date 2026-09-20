-- Weight is stored in pounds; kilograms are a display setting only.
-- Converts any rows already written in kg, then renames the column.

alter table tern.weight_entries drop constraint if exists weight_entries_kg_check;

alter table tern.weight_entries
  alter column kg type numeric(6, 2) using round(kg * 2.20462262185, 2);

alter table tern.weight_entries rename column kg to lb;

alter table tern.weight_entries
  add constraint weight_entries_lb_check check (lb between 40 and 1100);

-- The saved weight goal lives in the settings json.
update tern.settings
set data = (data - 'weightGoalKg')
  || jsonb_build_object(
       'weightGoalLb',
       round(((data ->> 'weightGoalKg')::numeric) * 2.20462262185, 1)
     )
where data ? 'weightGoalKg';
